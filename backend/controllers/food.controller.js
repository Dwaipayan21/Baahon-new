import mongoose from "mongoose";
import Pandal from "../models/pandal.model.js";
import rawPandals from "../data/pandals.json" with { type: "json" };

import {
  getFoodPlacesForPandal,
  DEFAULT_SEARCH_RADIUS_METERS,
} from "../services/food/foodRead.service.js";

import {
  discoverAndPersistFoodForPandal,
} from "../services/food/foodDiscoveryPersistence.service.js";

const MAX_RADIUS_METERS = 1000;
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 25;

async function resolvePandal(pandalId) {
  if (!pandalId || typeof pandalId !== "string") return null;

  const trimmedId = pandalId.trim();

  if (!trimmedId) return null;

  // First try MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(trimmedId)) {
    try {
      if (mongoose.connection.readyState === 1) {
        const doc = await Pandal.findById(trimmedId).lean();

        if (doc) {
          return doc;
        }
      }
    } catch {}
  }

  let matchedPandal = null;

  // Support pandal-0 / 0 style IDs
  const indexMatch =
    trimmedId.match(/^pandal-(\d+)$/i) ||
    trimmedId.match(/^(\d+)$/);

  if (indexMatch) {
    const idx = parseInt(indexMatch[1], 10);

    if (idx >= 0 && idx < rawPandals.length) {
      matchedPandal = {
        ...rawPandals[idx],
        id: `pandal-${idx}`,
      };
    }
  }

  // Search by pandal name
  if (!matchedPandal) {
    const normalizedSearch = trimmedId
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    for (let i = 0; i < rawPandals.length; i++) {
      const p = rawPandals[i];

      const pName = p.name
        ? p.name.trim()
        : "";

      // Exact name match
      if (
        pName.toLowerCase() ===
        trimmedId.toLowerCase()
      ) {
        matchedPandal = {
          ...p,
          id: `pandal-${i}`,
        };

        break;
      }

      // Normalized name match
      const pSlug = pName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      if (
        pSlug &&
        pSlug === normalizedSearch
      ) {
        matchedPandal = {
          ...p,
          id: `pandal-${i}`,
        };

        break;
      }
    }
  }

  if (!matchedPandal) {
    return null;
  }

  // If raw pandal doesn't have MongoDB _id,
  // try to find the corresponding DB document.
  if (
    !matchedPandal._id &&
    mongoose.connection.readyState === 1
  ) {
    try {
      const dbPandal = await Pandal.findOne({
        name: matchedPandal.name,
      }).lean();

      if (dbPandal) {
        matchedPandal._id = dbPandal._id;
      }
    } catch {}
  }

  return matchedPandal;
}

async function getFoodForPandal(req, res, next) {
  try {
    const { pandalId } = req.params;

    // ---------------------------------------
    // 1. Validate Pandal ID
    // ---------------------------------------

    if (
      !pandalId ||
      typeof pandalId !== "string" ||
      !pandalId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Pandal ID is required",
      });
    }

    // ---------------------------------------
    // 2. Validate radius
    // ---------------------------------------

    let radiusMeters =
      DEFAULT_SEARCH_RADIUS_METERS;

    if (req.query.radius !== undefined) {
      const parsedRadius = Number(
        req.query.radius
      );

      if (
        !Number.isFinite(parsedRadius) ||
        parsedRadius <= 0 ||
        parsedRadius > MAX_RADIUS_METERS
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Query parameter 'radius' must be a positive number up to ${MAX_RADIUS_METERS} meters`,
        });
      }

      radiusMeters = Math.round(
        parsedRadius
      );
    }

    // ---------------------------------------
    // 3. Validate limit
    // ---------------------------------------

    let limit = DEFAULT_LIMIT;

    if (req.query.limit !== undefined) {
      const parsedLimit = Number(
        req.query.limit
      );

      if (
        !Number.isInteger(parsedLimit) ||
        parsedLimit <= 0 ||
        parsedLimit > MAX_LIMIT
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Query parameter 'limit' must be a positive integer up to ${MAX_LIMIT}`,
        });
      }

      limit = parsedLimit;
    }

    let category;
    if (typeof req.query.category === "string" && req.query.category.trim()) {
      category = req.query.category.trim().toLowerCase();
    }

    // ---------------------------------------
    // 4. Resolve Pandal
    // ---------------------------------------

    const pandal = await resolvePandal(
      pandalId
    );

    if (!pandal) {
      return res.status(404).json({
        success: false,
        message: "Pandal not found",
      });
    }

    // ---------------------------------------
    // 5. Read existing food places
    // ---------------------------------------

    let places =
      await getFoodPlacesForPandal(
        pandal,
        {
          radiusMeters,
          limit,
          category,
        }
      );

    // ---------------------------------------
    // 6. If no food places exist,
    //    run Geoapify discovery
    // ---------------------------------------

    if (places.length === 0) {
      try {
        await discoverAndPersistFoodForPandal(
          pandal,
          {
            radiusMeters,
            limit,
          }
        );

        // ---------------------------------------
        // 7. Read newly persisted places
        // ---------------------------------------

        places =
          await getFoodPlacesForPandal(
            pandal,
            {
              radiusMeters,
              limit,
              category,
            }
          );
      } catch (discErr) {
        // Safe fallback if discovery/persistence is unavailable or offline
      }
    }

    // ---------------------------------------
    // 8. Resolve Pandal ID
    // ---------------------------------------

    const resolvedId = pandal._id
      ? String(pandal._id)
      : pandal.id || pandalId;

    // ---------------------------------------
    // 9. Return response
    // ---------------------------------------

    return res.status(200).json({
      success: true,

      pandalId: resolvedId,

      pandalName:
        pandal.name ||
        "Durga Puja Pandal",

      count: places.length,

      data: places,
    });
  } catch (error) {
    // ---------------------------------------
    // Sanitize sensitive information
    // ---------------------------------------

    if (error?.message) {
      error.message = error.message
        .replace(
          /mongodb(\+srv)?:\/\/[^@\s]+@/gi,
          "mongodb://$1<redacted>@"
        )
        .replace(
          /apiKey=[a-zA-Z0-9_-]+/gi,
          "apiKey=<redacted>"
        )
        .replace(
          /key=[a-zA-Z0-9_-]+/gi,
          "key=<redacted>"
        );
    }

    next(error);
  }
}

export {
  resolvePandal,
  getFoodForPandal,
  MAX_RADIUS_METERS,
  MAX_LIMIT,
  DEFAULT_LIMIT,
};
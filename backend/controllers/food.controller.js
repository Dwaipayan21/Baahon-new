import mongoose from "mongoose";
import Pandal from "../models/pandal.model.js";
import rawPandals from "../data/pandals.json" with { type: "json" };
import { sendSuccess, sendError } from "../utils/apiResponse.js";

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

const isDbConnected = () => mongoose.connection.readyState === 1;

const normalize = (value = "") =>
  value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const sanitizeError = (message = "") =>
  message
    .replace(/mongodb(\+srv)?:\/\/[^@\s]+@/gi, "mongodb://$1<redacted>@")
    .replace(/apiKey=[a-zA-Z0-9_-]+/gi, "apiKey=<redacted>")
    .replace(/key=[a-zA-Z0-9_-]+/gi, "key=<redacted>");

function validateQueryParams(req) {
  let radiusMeters = DEFAULT_SEARCH_RADIUS_METERS;
  let limit = DEFAULT_LIMIT;

  if (req.query.radius !== undefined) {
    const radius = Number(req.query.radius);

    if (
      !Number.isFinite(radius) ||
      radius <= 0 ||
      radius > MAX_RADIUS_METERS
    ) {
      return {
        error: `Query parameter 'radius' must be a positive number up to ${MAX_RADIUS_METERS} meters`,
      };
    }

    radiusMeters = Math.round(radius);
  }

  if (req.query.limit !== undefined) {
    const parsedLimit = Number(req.query.limit);

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit <= 0 ||
      parsedLimit > MAX_LIMIT
    ) {
      return {
        error: `Query parameter 'limit' must be a positive integer up to ${MAX_LIMIT}`,
      };
    }

    limit = parsedLimit;
  }

  const category =
    typeof req.query.category === "string" &&
    req.query.category.trim()
      ? req.query.category.trim().toLowerCase()
      : undefined;

  return {
    radiusMeters,
    limit,
    category,
  };
}

function findRawPandal(pandalId) {
  const indexMatch =
    pandalId.match(/^pandal-(\d+)$/i) ||
    pandalId.match(/^(\d+)$/);

  if (indexMatch) {
    const index = Number(indexMatch[1]);

    if (index >= 0 && index < rawPandals.length) {
      return {
        ...rawPandals[index],
        id: `pandal-${index}`,
      };
    }
  }

  const normalizedSearch = normalize(pandalId);

  return rawPandals.reduce((match, pandal, index) => {
    if (match || !pandal.name) return match;

    const name = pandal.name.trim();

    if (
      name.toLowerCase() === pandalId.toLowerCase() ||
      normalize(name) === normalizedSearch
    ) {
      return {
        ...pandal,
        id: `pandal-${index}`,
      };
    }

    return null;
  }, null);
}

async function resolvePandal(pandalId) {
  if (!pandalId || typeof pandalId !== "string") {
    return null;
  }

  const id = pandalId.trim();

  if (!id) {
    return null;
  }

  // Try MongoDB ObjectId first
  if (mongoose.Types.ObjectId.isValid(id) && isDbConnected()) {
    try {
      const pandal = await Pandal.findById(id).lean();

      if (pandal) {
        return pandal;
      }
    } catch {}
  }

  // Fall back to raw JSON data
  const pandal = findRawPandal(id);

  if (!pandal) {
    return null;
  }

  // Resolve MongoDB _id when possible
  if (!pandal._id && isDbConnected()) {
    try {
      const dbPandal = await Pandal.findOne({
        name: pandal.name,
      }).lean();

      if (dbPandal) {
        pandal._id = dbPandal._id;
      }
    } catch {}
  }

  return pandal;
}

async function getFoodForPandal(req, res, next) {
  try {
    const { pandalId } = req.params;

    if (!pandalId?.trim()) {
      return sendError(res, {
        statusCode: 400,
        message: "Pandal ID is required",
      });
    }

    const params = validateQueryParams(req);

    if (params.error) {
      return sendError(res, {
        statusCode: 400,
        message: params.error,
      });
    }

    const pandal = await resolvePandal(pandalId);

    if (!pandal) {
      return sendError(res, {
        statusCode: 404,
        message: "Pandal not found",
      });
    }

    const { radiusMeters, limit, category } = params;

    let places = await getFoodPlacesForPandal(pandal, {
      radiusMeters,
      limit,
      category,
    });

    // Discover and persist places when none exist
    if (places.length === 0) {
      try {
        await discoverAndPersistFoodForPandal(pandal, {
          radiusMeters,
          limit,
        });

        places = await getFoodPlacesForPandal(pandal, {
          radiusMeters,
          limit,
          category,
        });
      } catch {}
    }

    const resolvedId = pandal._id
      ? String(pandal._id)
      : pandal.id || pandalId;

    return sendSuccess(res, {
      message: "Food places fetched successfully",
      data: places,
      pandalId: resolvedId,
      pandalName: pandal.name || "Durga Puja Pandal",
      count: places.length,
    });
  } catch (error) {
    if (error?.message) {
      error.message = sanitizeError(error.message);
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
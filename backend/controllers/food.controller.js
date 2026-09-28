/**
 * Food Controller (Backend)
 * 
 * Handles reading nearby food places around Durga Puja pandals from MongoDB.
 * Validates pandal resolution and query parameters before delegating to foodRead.service.js.
 * 
 * READ-ONLY:
 * Does NOT call Geoapify or Overpass.
 * Does NOT invoke food discovery or persistence workflows.
 */

const mongoose = require("mongoose");
const Pandal = require("../models/pandal.model.js");
const rawPandals = require("../data/pandals.json");
const foodReadService = require("../services/foodRead.service.js");

const MAX_RADIUS_METERS = 1000;
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 25;

/**
 * Resolves a pandal by ID or identifier.
 * Priority:
 * 1. If valid ObjectId and MongoDB is connected, query Pandal.findById(pandalId).
 * 2. If not found in DB (or if not ObjectId / DB disconnected), search rawPandals:
 *    - By index if format is 'pandal-N' or numeric string (0 to rawPandals.length - 1)
 *    - By exact name match (case-insensitive)
 *    - By slugified name match (e.g. 'ekdalia-evergreen-club')
 * 
 * @param {string} pandalId
 * @returns {Promise<object|null>} Resolved pandal or null
 */
async function resolvePandal(pandalId) {
  if (!pandalId || typeof pandalId !== "string") return null;
  const trimmedId = pandalId.trim();
  if (!trimmedId) return null;

  // 1. Check MongoDB if valid ObjectId and connected
  if (mongoose.Types.ObjectId.isValid(trimmedId)) {
    try {
      if (mongoose.connection.readyState === 1) {
        const doc = await Pandal.findById(trimmedId).lean();
        if (doc) return doc;
      }
    } catch {
      // Fallback to static seed data on error
    }
  }

  // 2. Search fallback in rawPandals
  let matchedPandal = null;

  // Check index pattern: 'pandal-0', 'pandal-1', etc. or pure integer
  const indexMatch = trimmedId.match(/^pandal-(\d+)$/i) || trimmedId.match(/^(\d+)$/);
  if (indexMatch) {
    const idx = parseInt(indexMatch[1], 10);
    if (idx >= 0 && idx < rawPandals.length) {
      matchedPandal = { ...rawPandals[idx], id: `pandal-${idx}` };
    }
  }

  // Match by exact name or slug
  if (!matchedPandal) {
    const normalizedSearch = trimmedId.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (let i = 0; i < rawPandals.length; i++) {
      const p = rawPandals[i];
      const pName = p.name ? p.name.trim() : "";
      if (pName.toLowerCase() === trimmedId.toLowerCase()) {
        matchedPandal = { ...p, id: `pandal-${i}` };
        break;
      }
      const pSlug = pName.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (pSlug && pSlug === normalizedSearch) {
        matchedPandal = { ...p, id: `pandal-${i}` };
        break;
      }
    }
  }

  if (!matchedPandal) {
    return null;
  }

  // If matched from static data and MongoDB is connected, associate with the MongoDB document _id
  if (!matchedPandal._id && mongoose.connection.readyState === 1) {
    try {
      const dbPandal = await Pandal.findOne({ name: matchedPandal.name }).lean();
      if (dbPandal) {
        matchedPandal._id = dbPandal._id;
      }
    } catch {
      // Ignore DB lookup error and proceed with static pandal
    }
  }

  return matchedPandal;
}

/**
 * GET /api/pandals/:pandalId/food
 * Reads stored food places for the specified pandal from MongoDB.
 */
async function getFoodForPandal(req, res, next) {
  try {
    const { pandalId } = req.params;

    // Validate pandalId parameter presence
    if (!pandalId || typeof pandalId !== "string" || !pandalId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Pandal ID is required"
      });
    }

    // Validate query parameter: radius
    let radiusMeters = foodReadService.DEFAULT_SEARCH_RADIUS_METERS;
    if (req.query.radius !== undefined) {
      const parsedRadius = Number(req.query.radius);
      if (!Number.isFinite(parsedRadius) || parsedRadius <= 0 || parsedRadius > MAX_RADIUS_METERS) {
        return res.status(400).json({
          success: false,
          message: `Query parameter 'radius' must be a positive number up to ${MAX_RADIUS_METERS} meters`
        });
      }
      radiusMeters = Math.round(parsedRadius);
    }

    // Validate query parameter: limit
    let limit = DEFAULT_LIMIT;
    if (req.query.limit !== undefined) {
      const parsedLimit = Number(req.query.limit);
      if (!Number.isInteger(parsedLimit) || parsedLimit <= 0 || parsedLimit > MAX_LIMIT) {
        return res.status(400).json({
          success: false,
          message: `Query parameter 'limit' must be a positive integer up to ${MAX_LIMIT}`
        });
      }
      limit = parsedLimit;
    }

    // Resolve the requested pandal
    const pandal = await resolvePandal(pandalId);
    if (!pandal) {
      return res.status(404).json({
        success: false,
        message: "Pandal not found"
      });
    }

    // Read stored food places from MongoDB (read-only query)
    const places = await foodReadService.getFoodPlacesForPandal(pandal, {
      radiusMeters,
      limit
    });

    const resolvedId = pandal._id ? String(pandal._id) : (pandal.id || pandalId);

    return res.status(200).json({
      success: true,
      pandalId: resolvedId,
      pandalName: pandal.name || "Durga Puja Pandal",
      count: places.length,
      data: places
    });
  } catch (error) {
    if (error && error.message) {
      error.message = error.message.replace(/mongodb(\+srv)?:\/\/[^@\s]+@/gi, "mongodb://$1<redacted>@");
      error.message = error.message.replace(/apiKey=[a-zA-Z0-9_-]+/gi, "apiKey=<redacted>");
      error.message = error.message.replace(/key=[a-zA-Z0-9_-]+/gi, "key=<redacted>");
    }
    next(error);
  }
}

module.exports = {
  resolvePandal,
  getFoodForPandal,
  MAX_RADIUS_METERS,
  MAX_LIMIT,
  DEFAULT_LIMIT
};

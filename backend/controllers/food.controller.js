/**
 * Food Controller (Backend)
 * 
 * Handles discovery of nearby food places around Durga Puja pandals.
 * Validates pandal resolution, coordinates, and query parameters before invoking
 * the foodDiscoveryService.
 */

const mongoose = require("mongoose");
const Pandal = require("../models/pandal.model.js");
const rawPandals = require("../data/pandals.json");
const foodDiscoveryService = require("../services/foodDiscovery.service.js");

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
  // Check index pattern: 'pandal-0', 'pandal-1', etc. or pure integer
  const indexMatch = trimmedId.match(/^pandal-(\d+)$/i) || trimmedId.match(/^(\d+)$/);
  if (indexMatch) {
    const idx = parseInt(indexMatch[1], 10);
    if (idx >= 0 && idx < rawPandals.length) {
      return { ...rawPandals[idx], id: `pandal-${idx}` };
    }
  }

  // Match by exact name or slug
  const normalizedSearch = trimmedId.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (let i = 0; i < rawPandals.length; i++) {
    const p = rawPandals[i];
    const pName = p.name ? p.name.trim() : "";
    if (pName.toLowerCase() === trimmedId.toLowerCase()) {
      return { ...p, id: `pandal-${i}` };
    }
    const pSlug = pName.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (pSlug && pSlug === normalizedSearch) {
      return { ...p, id: `pandal-${i}` };
    }
  }

  return null;
}

/**
 * GET /api/pandals/:pandalId/food
 * Discovers food places near the specified pandal.
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
    let radiusMeters = foodDiscoveryService.FOOD_SEARCH_RADIUS_METERS;
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

    // Validate coordinates before invoking food discovery service
    const coords = foodDiscoveryService.extractCoordinates(pandal);
    if (!coords) {
      return res.status(400).json({
        success: false,
        message: "Pandal coordinates are missing or invalid"
      });
    }

    // Invoke food discovery service
    const result = await foodDiscoveryService.discoverFoodNearPandal(pandal, {
      radiusMeters,
      limit
    });

    // Handle service / upstream errors
    if (!result.success) {
      return res.status(502).json({
        success: false,
        message: "Failed to discover food places from upstream service"
      });
    }

    const resolvedId = pandal._id ? String(pandal._id) : (pandal.id || pandalId);

    return res.status(200).json({
      success: true,
      pandalId: resolvedId,
      pandalName: pandal.name || "Durga Puja Pandal",
      count: result.places.length,
      data: result.places
    });
  } catch (error) {
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

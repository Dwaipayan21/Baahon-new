/**
 * Food Read Service (Backend)
 * 
 * Responsible for querying persisted food places from MongoDB (FoodPlace collection),
 * filtering by pandalId and distance radius, sorting ascending by distance, applying limits,
 * and mapping MongoDB documents to standardized 11-field API response items.
 * 
 * DOES NOT:
 * - Call Geoapify or Overpass
 * - Perform automatic discovery or persistence
 * - Modify, delete, or recalculate stored food places
 */

const mongoose = require("mongoose");
const FoodPlace = require("../models/foodPlace.model.js");

const DEFAULT_SEARCH_RADIUS_METERS = 500;
const MAX_SEARCH_RADIUS_METERS = 1000;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;

/**
 * Maps an internal MongoDB FoodPlace document to a sanitized, normalized API object.
 * Maps `_id` -> `id` and strips database-internal fields (__v, createdAt, updatedAt).
 * 
 * @param {object} doc Mongoose document or lean object
 * @returns {object} Standardized 11-field food place object
 */
function mapFoodPlaceDocumentToResponse(doc) {
  if (!doc || typeof doc !== "object") return null;

  return {
    id: String(doc._id),
    pandalId: String(doc.pandalId),
    name: doc.name,
    latitude: doc.latitude,
    longitude: doc.longitude,
    distanceFromPandal: doc.distanceFromPandal,
    distanceBand: doc.distanceBand,
    category: doc.category,
    address: doc.address || "",
    source: doc.source,
    sourceId: doc.sourceId
  };
}

/**
 * Sanitizes any raw database error to avoid leaking credentials, URIs, or secrets.
 * 
 * @param {Error|any} err 
 * @returns {string} Sanitized error message
 */
function sanitizeDatabaseError(err) {
  if (!err) return "Database query failed";
  let msg = typeof err === "string" ? err : err.message || "Database query failed";

  msg = msg.replace(/mongodb(\+srv)?:\/\/[^@\s]+@/gi, "mongodb://$1<redacted>@");
  msg = msg.replace(/apiKey=[a-zA-Z0-9_-]+/gi, "apiKey=<redacted>");
  msg = msg.replace(/key=[a-zA-Z0-9_-]+/gi, "key=<redacted>");

  return msg;
}

/**
 * Reads persisted food places for a pandal from MongoDB.
 * 
 * @param {object|string} pandal Pandal object or pandalId string
 * @param {object} [options]
 * @param {number} [options.radiusMeters=500] Maximum distance in meters
 * @param {number} [options.limit=25] Maximum number of records to return
 * @param {object} [options.Model=FoodPlace] Model override for testing
 * @returns {Promise<object[]>} Array of mapped normalized food places
 */
async function getFoodPlacesForPandal(pandal, options = {}) {
  const Model = options.Model || FoodPlace;
  const radius = options.radiusMeters !== undefined ? options.radiusMeters : DEFAULT_SEARCH_RADIUS_METERS;
  const limit = options.limit !== undefined ? options.limit : DEFAULT_LIMIT;

  // Resolve target pandal ID
  let rawPandalId;
  if (typeof pandal === "string") {
    rawPandalId = pandal;
  } else if (pandal && typeof pandal === "object") {
    rawPandalId = pandal._id ? String(pandal._id) : (pandal.id || null);
  }

  if (!rawPandalId) {
    return [];
  }

  // Construct query filter
  const filter = {};

  if (mongoose.Types.ObjectId.isValid(rawPandalId)) {
    filter.pandalId = new mongoose.Types.ObjectId(rawPandalId);
  } else {
    // Non-ObjectId fallback
    filter.pandalId = rawPandalId;
  }

  if (typeof radius === "number" && radius > 0) {
    filter.distanceFromPandal = { $lte: radius };
  }

  let docs;
  try {
    docs = await Model.find(filter)
      .sort({ distanceFromPandal: 1 })
      .limit(limit)
      .lean();
  } catch (err) {
    const safeMsg = sanitizeDatabaseError(err);
    const dbErr = new Error(`Failed to read food places: ${safeMsg}`);
    dbErr.statusCode = 500;
    throw dbErr;
  }

  if (!Array.isArray(docs) || docs.length === 0) {
    return [];
  }

  return docs.map(mapFoodPlaceDocumentToResponse).filter(Boolean);
}

module.exports = {
  getFoodPlacesForPandal,
  mapFoodPlaceDocumentToResponse,
  DEFAULT_SEARCH_RADIUS_METERS,
  MAX_SEARCH_RADIUS_METERS,
  DEFAULT_LIMIT,
  MAX_LIMIT
};

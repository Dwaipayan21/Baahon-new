/**
 * Food Persistence Service (Backend)
 * 
 * Takes normalized food-place records produced by foodDiscovery.service.js
 * and safely persists/upserts them into MongoDB using the FoodPlace model.
 * 
 * Identity for deduplication:
 *   { source, sourceId, pandalId }
 * 
 * Does NOT:
 * - Call external APIs (Geoapify, Overpass, etc.)
 * - Calculate geographic distances
 * - Modify discovery algorithms
 */

const mongoose = require("mongoose");
const FoodPlace = require("../models/foodPlace.model.js");

const ALLOWED_DISTANCE_BANDS = [
  "very_nearby",
  "nearby",
  "further",
  "beyond_1000m",
  "unknown"
];

/**
 * Sanitizes any raw database error to avoid leaking credentials, URIs, or secrets.
 * 
 * @param {Error|any} err 
 * @returns {string} Sanitized error message
 */
function sanitizeDatabaseError(err) {
  if (!err) return "Unknown database error";
  let msg = typeof err === "string" ? err : err.message || "Database operation failed";

  // Strip MongoDB connection URIs (e.g. mongodb://user:pass@host)
  msg = msg.replace(/mongodb(\+srv)?:\/\/[^@\s]+@/gi, "mongodb://$1<redacted>@");
  // Strip potential API keys or query params
  msg = msg.replace(/apiKey=[a-zA-Z0-9_-]+/gi, "apiKey=<redacted>");
  msg = msg.replace(/key=[a-zA-Z0-9_-]+/gi, "key=<redacted>");

  return msg;
}

/**
 * Validates a single normalized food place object prior to database persistence.
 * 
 * @param {object} place Normalized food place record
 * @returns {{ valid: boolean, error?: string, sanitized?: object }}
 */
function validateNormalizedFoodPlace(place) {
  if (!place || typeof place !== "object" || Array.isArray(place)) {
    return { valid: false, error: "Record must be a non-null object" };
  }

  // 1. pandalId: Must exist and be a valid MongoDB ObjectId
  if (!place.pandalId) {
    return { valid: false, error: "pandalId is required" };
  }
  const pandalIdStr = String(place.pandalId).trim();
  if (!mongoose.Types.ObjectId.isValid(pandalIdStr)) {
    return { valid: false, error: `Invalid pandalId: "${pandalIdStr}" is not a valid MongoDB ObjectId` };
  }

  // 2. name: Required non-empty string
  if (typeof place.name !== "string" || !place.name.trim()) {
    return { valid: false, error: "name must be a non-empty string" };
  }

  // 3. latitude: Required finite number between -90 and 90
  const lat = Number(place.latitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { valid: false, error: `latitude must be a number between -90 and 90. Received: ${place.latitude}` };
  }

  // 4. longitude: Required finite number between -180 and 180
  const lng = Number(place.longitude);
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { valid: false, error: `longitude must be a number between -180 and 180. Received: ${place.longitude}` };
  }

  // 5. distanceFromPandal: Required non-negative finite number
  const dist = Number(place.distanceFromPandal);
  if (!Number.isFinite(dist) || dist < 0) {
    return { valid: false, error: `distanceFromPandal must be a non-negative number. Received: ${place.distanceFromPandal}` };
  }

  // 6. distanceBand: Required enum value
  if (!place.distanceBand || !ALLOWED_DISTANCE_BANDS.includes(place.distanceBand)) {
    return {
      valid: false,
      error: `distanceBand must be one of: ${ALLOWED_DISTANCE_BANDS.join(", ")}. Received: "${place.distanceBand}"`
    };
  }

  // 7. category: Required string
  if (typeof place.category !== "string" || !place.category.trim()) {
    return { valid: false, error: "category must be a non-empty string" };
  }

  // 8. source: Required string
  if (typeof place.source !== "string" || !place.source.trim()) {
    return { valid: false, error: "source must be a non-empty string" };
  }

  // 9. sourceId: Required string
  if (typeof place.sourceId !== "string" || !place.sourceId.trim()) {
    return { valid: false, error: "sourceId must be a non-empty string" };
  }

  // Strip custom `id` field and prepare clean persistence payload
  const sanitized = {
    pandalId: new mongoose.Types.ObjectId(pandalIdStr),
    name: place.name.trim(),
    latitude: lat,
    longitude: lng,
    distanceFromPandal: Math.round(dist),
    distanceBand: place.distanceBand,
    category: place.category.trim(),
    address: place.address && typeof place.address === "string" ? place.address.trim() : "",
    source: place.source.trim(),
    sourceId: place.sourceId.trim()
  };

  return { valid: true, sanitized };
}

/**
 * Upserts a single normalized food place document using identity:
 * { source, sourceId, pandalId }
 * 
 * @param {object} place Normalized food place
 * @param {object} [options]
 * @param {object} [options.Model=FoodPlace] Model override for testing
 * @returns {Promise<{ created: boolean, updated: boolean, data: object }>}
 */
async function persistFoodPlace(place, options = {}) {
  const Model = options.Model || FoodPlace;
  const validation = validateNormalizedFoodPlace(place);
  if (!validation.valid) {
    const error = new Error(`FoodPlace validation failed: ${validation.error}`);
    error.name = "ValidationError";
    throw error;
  }

  const { sanitized } = validation;
  const filter = {
    source: sanitized.source,
    sourceId: sanitized.sourceId,
    pandalId: sanitized.pandalId
  };

  try {
    const rawResult = await Model.findOneAndUpdate(
      filter,
      { $set: sanitized },
      {
        upsert: true,
        new: true,
        runValidators: true,
        includeResultMetadata: true
      }
    );

    const isUpdated = rawResult?.lastErrorObject?.updatedExisting === true;
    const isCreated = rawResult?.lastErrorObject?.updatedExisting === false;
    const doc = rawResult?.value !== undefined ? rawResult.value : rawResult;

    return {
      created: isCreated,
      updated: isUpdated,
      data: doc
    };
  } catch (err) {
    const sanitizedMsg = sanitizeDatabaseError(err);
    const dbError = new Error(`Database error persisting food place: ${sanitizedMsg}`);
    dbError.name = "DatabasePersistenceError";
    throw dbError;
  }
}

/**
 * Persists an array of normalized food places.
 * Safely handles empty input without database calls.
 * Reports counts of total, created, updated, and failed items.
 * 
 * @param {object[]} places Array of normalized food place objects
 * @param {object} [options]
 * @param {object} [options.Model=FoodPlace] Model override for testing
 * @returns {Promise<{ total: number, created: number, updated: number, failed: number, data: object[], errors: object[] }>}
 */
async function persistFoodPlaces(places, options = {}) {
  if (!Array.isArray(places) || places.length === 0) {
    return {
      total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      data: [],
      errors: []
    };
  }

  const result = {
    total: places.length,
    created: 0,
    updated: 0,
    failed: 0,
    data: [],
    errors: []
  };

  for (let i = 0; i < places.length; i++) {
    const item = places[i];
    try {
      const outcome = await persistFoodPlace(item, options);
      if (outcome.created) {
        result.created++;
      } else if (outcome.updated) {
        result.updated++;
      } else {
        // Fallback if metadata is not provided by mock
        result.created++;
      }
      result.data.push(outcome.data);
    } catch (err) {
      result.failed++;
      result.errors.push({
        index: i,
        sourceId: item?.sourceId || null,
        name: item?.name || null,
        error: sanitizeDatabaseError(err)
      });
    }
  }

  return result;
}

module.exports = {
  validateNormalizedFoodPlace,
  persistFoodPlace,
  persistFoodPlaces,
  sanitizeDatabaseError,
  ALLOWED_DISTANCE_BANDS
};

import mongoose from "mongoose";
import FoodPlace from "../../models/foodPlace.model.js";

const ALLOWED_DISTANCE_BANDS = [
  "very_nearby",
  "nearby",
  "further",
  "beyond_1000m",
  "unknown",
];

function sanitizeDatabaseError(err) {
  if (!err) return "Unknown database error";

  let msg =
    typeof err === "string"
      ? err
      : err.message || "Database operation failed";

  msg = msg.replace(
    /mongodb(\+srv)?:\/\/[^@\s]+@/gi,
    "mongodb://$1<redacted>@"
  );

  msg = msg.replace(
    /apiKey=[a-zA-Z0-9_-]+/gi,
    "apiKey=<redacted>"
  );

  msg = msg.replace(
    /key=[a-zA-Z0-9_-]+/gi,
    "key=<redacted>"
  );

  return msg;
}

function validateNormalizedFoodPlace(place) {
  if (!place || typeof place !== "object" || Array.isArray(place)) {
    return {
      valid: false,
      error: "Record must be a non-null object",
    };
  }

  if (!place.pandalId) {
    return {
      valid: false,
      error: "pandalId is required",
    };
  }

  const pandalIdStr = String(place.pandalId).trim();

  if (!mongoose.Types.ObjectId.isValid(pandalIdStr)) {
    return {
      valid: false,
      error: `Invalid pandalId: "${pandalIdStr}" is not a valid MongoDB ObjectId`,
    };
  }

  if (typeof place.name !== "string" || !place.name.trim()) {
    return {
      valid: false,
      error: "name must be a non-empty string",
    };
  }

  const lat = Number(place.latitude);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return {
      valid: false,
      error: `latitude must be a number between -90 and 90. Received: ${place.latitude}`,
    };
  }

  const lng = Number(place.longitude);

  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return {
      valid: false,
      error: `longitude must be a number between -180 and 180. Received: ${place.longitude}`,
    };
  }

  const dist = Number(place.distanceFromPandal);

  if (!Number.isFinite(dist) || dist < 0) {
    return {
      valid: false,
      error: `distanceFromPandal must be a non-negative number. Received: ${place.distanceFromPandal}`,
    };
  }

  if (
    !place.distanceBand ||
    !ALLOWED_DISTANCE_BANDS.includes(place.distanceBand)
  ) {
    return {
      valid: false,
      error: `distanceBand must be one of: ${ALLOWED_DISTANCE_BANDS.join(", ")}. Received: "${place.distanceBand}"`,
    };
  }

  if (typeof place.category !== "string" || !place.category.trim()) {
    return {
      valid: false,
      error: "category must be a non-empty string",
    };
  }

  if (typeof place.source !== "string" || !place.source.trim()) {
    return {
      valid: false,
      error: "source must be a non-empty string",
    };
  }

  if (typeof place.sourceId !== "string" || !place.sourceId.trim()) {
    return {
      valid: false,
      error: "sourceId must be a non-empty string",
    };
  }

  const sanitized = {
    pandalId: new mongoose.Types.ObjectId(pandalIdStr),
    name: place.name.trim(),
    latitude: lat,
    longitude: lng,
    distanceFromPandal: Math.round(dist),
    distanceBand: place.distanceBand,
    category: place.category.trim(),
    address:
      typeof place.address === "string"
        ? place.address.trim()
        : "",
    source: place.source.trim(),
    sourceId: place.sourceId.trim(),
  };

  return {
    valid: true,
    sanitized,
  };
}

async function persistFoodPlace(place, options = {}) {
  const Model = options.Model || FoodPlace;

  const validation = validateNormalizedFoodPlace(place);

  if (!validation.valid) {
    const error = new Error(
      `FoodPlace validation failed: ${validation.error}`
    );

    error.name = "ValidationError";
    throw error;
  }

  const { sanitized } = validation;

  const filter = {
    source: sanitized.source,
    sourceId: sanitized.sourceId,
    pandalId: sanitized.pandalId,
  };

  try {
    const rawResult = await Model.findOneAndUpdate(
      filter,
      { $set: sanitized },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
        includeResultMetadata: true,
      }
    );

    const isUpdated =
      rawResult?.lastErrorObject?.updatedExisting === true;

    const isCreated =
      rawResult?.lastErrorObject?.updatedExisting === false;

    const doc =
      rawResult?.value !== undefined
        ? rawResult.value
        : rawResult;

    return {
      created: isCreated,
      updated: isUpdated,
      data: doc,
    };
  } catch (err) {
    const sanitizedMsg = sanitizeDatabaseError(err);

    const dbError = new Error(
      `Database error persisting food place: ${sanitizedMsg}`
    );

    dbError.name = "DatabasePersistenceError";

    throw dbError;
  }
}

async function persistFoodPlaces(places, options = {}) {
  if (!Array.isArray(places) || places.length === 0) {
    return {
      total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      data: [],
      errors: [],
    };
  }

  const result = {
    total: places.length,
    created: 0,
    updated: 0,
    failed: 0,
    data: [],
    errors: [],
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
        result.created++;
      }

      result.data.push(outcome.data);
    } catch (err) {
      result.failed++;

      result.errors.push({
        index: i,
        sourceId: item?.sourceId || null,
        name: item?.name || null,
        error: sanitizeDatabaseError(err),
      });
    }
  }

  return result;
}

export {
  validateNormalizedFoodPlace,
  persistFoodPlace,
  persistFoodPlaces,
  sanitizeDatabaseError,
  ALLOWED_DISTANCE_BANDS,
};
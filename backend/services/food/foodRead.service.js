import mongoose from "mongoose";
import FoodPlace from "../../models/foodPlace.model.js";

const DEFAULT_SEARCH_RADIUS_METERS = 1000;
const MAX_SEARCH_RADIUS_METERS = 1000;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;

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
    sourceId: doc.sourceId,
  };
}

function sanitizeDatabaseError(err) {
  if (!err) return "Database query failed";

  let msg =
    typeof err === "string"
      ? err
      : err.message || "Database query failed";

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

async function getFoodPlacesForPandal(pandal, options = {}) {
  // If MongoDB is not connected, return empty list gracefully
  if (mongoose.connection.readyState !== 1 && !options.Model) {
    return [];
  }

  const Model = options.Model || FoodPlace;

  const radius =
    options.radiusMeters !== undefined
      ? options.radiusMeters
      : DEFAULT_SEARCH_RADIUS_METERS;

  const limit =
    options.limit !== undefined
      ? options.limit
      : DEFAULT_LIMIT;

  let rawPandalId;

  if (typeof pandal === "string") {
    rawPandalId = pandal;
  } else if (pandal && typeof pandal === "object") {
    rawPandalId = pandal._id
      ? String(pandal._id)
      : pandal.id || null;
  }

  if (!rawPandalId) return [];

  const filter = {};

  if (mongoose.Types.ObjectId.isValid(rawPandalId)) {
    filter.pandalId = new mongoose.Types.ObjectId(rawPandalId);
  } else {
    filter.pandalId = rawPandalId;
  }

  if (typeof radius === "number" && radius > 0) {
    filter.distanceFromPandal = {
      $lte: radius,
    };
  }

  if (typeof options.category === "string" && options.category.trim()) {
    filter.category = options.category.trim().toLowerCase();
  }

  let docs;

  try {
    docs = await Model.find(filter)
      .sort({ distanceFromPandal: 1 })
      .limit(limit)
      .lean();
  } catch (err) {
    const safeMsg = sanitizeDatabaseError(err);

    const dbErr = new Error(
      `Failed to read food places: ${safeMsg}`
    );

    dbErr.statusCode = 500;

    throw dbErr;
  }

  if (!Array.isArray(docs) || docs.length === 0) {
    return [];
  }

  return docs
    .map(mapFoodPlaceDocumentToResponse)
    .filter(Boolean);
}

export {
  getFoodPlacesForPandal,
  mapFoodPlaceDocumentToResponse,
  sanitizeDatabaseError,
  DEFAULT_SEARCH_RADIUS_METERS,
  MAX_SEARCH_RADIUS_METERS,
  DEFAULT_LIMIT,
  MAX_LIMIT,
};
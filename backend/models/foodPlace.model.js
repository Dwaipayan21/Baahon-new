const mongoose = require("mongoose");

const foodPlaceSchema = new mongoose.Schema(
  {
    pandalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pandal",
      required: [true, "pandalId is required"],
    },
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, "latitude is required"],
      min: [-90, "Latitude must be between -90 and 90"],
      max: [90, "Latitude must be between -90 and 90"],
    },
    longitude: {
      type: Number,
      required: [true, "longitude is required"],
      min: [-180, "Longitude must be between -180 and 180"],
      max: [180, "Longitude must be between -180 and 180"],
    },
    distanceFromPandal: {
      type: Number,
      required: [true, "distanceFromPandal is required"],
      min: [0, "distanceFromPandal must not be negative"],
    },
    distanceBand: {
      type: String,
      required: [true, "distanceBand is required"],
      enum: {
        values: [
          "very_nearby",
          "nearby",
          "further",
          "beyond_1000m",
          "unknown",
        ],
        message: "{VALUE} is not a valid distanceBand",
      },
    },
    category: {
      type: String,
      required: [true, "category is required"],
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      required: [true, "source is required"],
      default: "geoapify",
      trim: true,
    },
    sourceId: {
      type: String,
      required: [true, "sourceId is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent inserting duplicate provider records for the same pandal
foodPlaceSchema.index(
  { source: 1, sourceId: 1, pandalId: 1 },
  { unique: true }
);

// Index for querying food places belonging to a specific pandal
foodPlaceSchema.index({ pandalId: 1 });

module.exports = mongoose.model("FoodPlace", foodPlaceSchema);

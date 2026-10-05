import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import Pandal from "./models/pandal.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PANDAL_JSON_PATH = path.join(
  __dirname,
  "data",
  "Baahon_final_sheet.json"
);

const CROWD_JSON_PATH = path.join(
  __dirname,
  "data",
  "crowdSamplePoints.json"
);

// --------------------------------------------------
// Load JSON files
// --------------------------------------------------

const loadJsonFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`JSON file not found: ${filePath}`);
  }

  const file = fs.readFileSync(filePath, "utf-8");

  try {
    return JSON.parse(file);
  } catch (error) {
    throw new Error(`Invalid JSON file: ${filePath}`);
  }
};

// --------------------------------------------------
// Convert one pandal into MongoDB format
// --------------------------------------------------

const formatPandal = (item, crowdSamplePoints) => {
  const {
    ["location/type"]: type,
    ["location/coordinates/0"]: longitude,
    ["location/coordinates/1"]: latitude,
    verified,
    ...pandal
  } = item;

  // Validate location type
  if (type !== "Point") {
    throw new Error(
      `Invalid location type for "${pandal.name}": ${type}`
    );
  }

  // Validate coordinates exist
  if (
    longitude == null ||
    latitude == null ||
    String(longitude).trim() === "" ||
    String(latitude).trim() === ""
  ) {
    throw new Error(
      `Missing coordinates for "${pandal.name}"`
    );
  }

  const lng = Number(longitude);
  const lat = Number(latitude);

  // Validate longitude
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new Error(
      `Invalid longitude for "${pandal.name}": ${longitude}`
    );
  }

  // Validate latitude
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error(
      `Invalid latitude for "${pandal.name}": ${latitude}`
    );
  }

  // Validate name
  if (!pandal.name || String(pandal.name).trim() === "") {
    throw new Error("Pandal name is missing");
  }

  return {
    ...pandal,

    name: String(pandal.name).trim(),

    verified:
      String(verified ?? "")
        .trim()
        .toLowerCase() === "true",

    // GeoJSON requires [longitude, latitude]
    location: {
      type: "Point",
      coordinates: [lng, lat],
    },

    // Preserve existing crowd sample point data
    crowdSamplePoints:
      crowdSamplePoints[pandal.name] || [],
  };
};

// --------------------------------------------------
// Seed database
// --------------------------------------------------

const seedDatabase = async () => {
  try {
    // Check MongoDB URI
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing from your .env file"
      );
    }

    // Load pandal JSON
    const rawPandals = loadJsonFile(PANDAL_JSON_PATH);

    if (!Array.isArray(rawPandals)) {
      throw new Error(
        "Baahon_final_sheet.json must contain an array"
      );
    }

    // Load crowd sample points
    const crowdSamplePoints = loadJsonFile(
      CROWD_JSON_PATH
    );

    console.log(
      `Found ${rawPandals.length} pandals in JSON`
    );

    // Format and validate every pandal BEFORE modifying DB
    const pandals = rawPandals.map((pandal) =>
      formatPandal(
        pandal,
        crowdSamplePoints
      )
    );

    console.log(
      `Validated ${pandals.length}/${rawPandals.length} pandals`
    );

    // Connect MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    // Remove existing pandal records
    await Pandal.deleteMany({});

    console.log("Existing pandal records deleted");

    // Insert new pandals
    const insertedPandals =
      await Pandal.insertMany(pandals);

    console.log(
      `${insertedPandals.length} pandals inserted successfully`
    );

  } catch (error) {
    console.error("\nSeeding failed:");
    console.error(error.message);

    process.exitCode = 1;

  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    }
  }
};

seedDatabase();
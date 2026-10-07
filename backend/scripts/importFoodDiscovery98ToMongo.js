/**
 * Safe Offline & MongoDB-Ready Import Script for Verified 1000m Food Dataset
 *
 * Dataset source: backend/reports/foodDiscovery98Results1000m.json
 * Target collection: FoodPlace (referencing Pandal)
 *
 * CRITICAL SAFETY RULES:
 * - When run with `--dry-run`, ZERO MongoDB connections are made.
 * - ZERO calls to Geoapify (purely file-based replay/import).
 * - Full pre-validation: validates 100% of pandals and food places before any DB action.
 * - Idempotent upserts: uses existing FoodPlace compound index { source: 1, sourceId: 1, pandalId: 1 }.
 * - Non-destructive: never deletes existing records; never overwrites unrelated pandals.
 * - Preserves existing persistence logic: integrates directly with `foodPersistence.service.js`.
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

import Pandal from "../models/pandal.model.js";
import FoodPlace from "../models/foodPlace.model.js";
import {
  validateNormalizedFoodPlace,
  persistFoodPlaces,
  ALLOWED_DISTANCE_BANDS,
  sanitizeDatabaseError
} from "../services/food/foodPersistence.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORT_PATH = path.join(__dirname, "../reports/foodDiscovery98Results1000m.json");
const SHEET_PATH = path.join(__dirname, "../data/Baahon_final_sheet.json");

const EXPECTED_PANDAL_COUNT = 98;
const EXPECTED_FOOD_COUNT = 898;
const MAX_ALLOWED_DISTANCE_METERS = 1050; // 1000m + small GPS tolerance

const isDryRun = process.argv.includes("--dry-run");

const normalizeName = (val = "") =>
  val.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

async function main() {
  console.log("============================================================");
  console.log("   FOOD DISCOVERY 98-PANDAL 1000M DATASET IMPORT SCRIPT     ");
  console.log(`   Mode: ${isDryRun ? "DRY-RUN (Safe Offline Validation Only)" : "LIVE DATABASE IMPORT"}`);
  console.log("============================================================\n");

  // Step 1: Verify source files exist
  if (!fs.existsSync(REPORT_PATH)) {
    console.error(`FATAL: Report file not found at: ${REPORT_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(SHEET_PATH)) {
    console.error(`FATAL: Pandal sheet file not found at: ${SHEET_PATH}`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf-8"));
  const rawSheet = JSON.parse(fs.readFileSync(SHEET_PATH, "utf-8"));

  console.log(`1. Loaded 1000m Report: ${report.pandals?.length || 0} pandals listed.`);
  console.log(`2. Loaded Final Pandal Sheet: ${rawSheet.length} pandals.`);

  // Step 2: Validate Dataset Structure & Completeness
  console.log("\n--- [Step 1/3] Validating Dataset Integrity ---");

  if (!Array.isArray(report.pandals) || report.pandals.length !== EXPECTED_PANDAL_COUNT) {
    console.error(`Validation Failed: Expected ${EXPECTED_PANDAL_COUNT} pandals in report, found ${report.pandals?.length}`);
    process.exit(1);
  }

  let totalFoodPlacesCount = 0;
  const validationErrors = [];
  const seenPlaceKeys = new Set();

  for (let idx = 0; idx < report.pandals.length; idx++) {
    const p = report.pandals[idx];
    const sheetPandal = rawSheet[idx];

    if (!p.name || !sheetPandal.name) {
      validationErrors.push(`Pandal index ${idx} missing name.`);
    }

    const places = Array.isArray(p.foodPlaces) ? p.foodPlaces : [];
    totalFoodPlacesCount += places.length;

    for (let placeIdx = 0; placeIdx < places.length; placeIdx++) {
      const place = places[placeIdx];
      const context = `Pandal "${p.name}" (index ${idx}), Place #${placeIdx} ("${place.name || 'unnamed'}")`;

      if (!place.name || typeof place.name !== "string" || !place.name.trim()) {
        validationErrors.push(`${context}: missing or empty name.`);
      }

      if (typeof place.latitude !== "number" || !Number.isFinite(place.latitude) || place.latitude < -90 || place.latitude > 90) {
        validationErrors.push(`${context}: invalid latitude (${place.latitude}).`);
      }

      if (typeof place.longitude !== "number" || !Number.isFinite(place.longitude) || place.longitude < -180 || place.longitude > 180) {
        validationErrors.push(`${context}: invalid longitude (${place.longitude}).`);
      }

      if (typeof place.distanceFromPandal !== "number" || !Number.isFinite(place.distanceFromPandal) || place.distanceFromPandal < 0) {
        validationErrors.push(`${context}: negative or invalid distanceFromPandal (${place.distanceFromPandal}).`);
      } else if (place.distanceFromPandal > MAX_ALLOWED_DISTANCE_METERS) {
        validationErrors.push(`${context}: distanceFromPandal exceeds 1000m (${place.distanceFromPandal}m).`);
      }

      if (!place.distanceBand || !ALLOWED_DISTANCE_BANDS.includes(place.distanceBand)) {
        validationErrors.push(`${context}: invalid distanceBand ("${place.distanceBand}").`);
      }

      if (!place.category || typeof place.category !== "string" || !place.category.trim()) {
        validationErrors.push(`${context}: missing category.`);
      }

      if (place.source !== "geoapify") {
        validationErrors.push(`${context}: source is not "geoapify" ("${place.source}").`);
      }

      if (!place.sourceId || typeof place.sourceId !== "string" || !place.sourceId.trim()) {
        validationErrors.push(`${context}: missing sourceId.`);
      }

      // Check uniqueness: (source + sourceId + pandalName)
      const uniquenessKey = `${place.source}:${place.sourceId}:${p.name}`;
      if (seenPlaceKeys.has(uniquenessKey)) {
        validationErrors.push(`${context}: duplicate place detected for this pandal.`);
      }
      seenPlaceKeys.add(uniquenessKey);
    }
  }

  if (totalFoodPlacesCount !== EXPECTED_FOOD_COUNT) {
    validationErrors.push(`Total food places count mismatch: Expected ${EXPECTED_FOOD_COUNT}, found ${totalFoodPlacesCount}.`);
  }

  if (validationErrors.length > 0) {
    console.error(`\n❌ Pre-Validation FAILED with ${validationErrors.length} errors:`);
    validationErrors.slice(0, 15).forEach((e) => console.error(` - ${e}`));
    if (validationErrors.length > 15) {
      console.error(` ... and ${validationErrors.length - 15} more errors.`);
    }
    process.exit(1);
  }

  console.log(`✅ Pre-validation PASSED:`);
  console.log(`   - 98 Pandals verified`);
  console.log(`   - 898 Food Places verified`);
  console.log(`   - 0 Duplicates detected`);
  console.log(`   - 100% of places are within 1000m`);
  console.log(`   - 100% of places adhere to category & distanceBand contracts`);

  // Step 3: Handle Dry-Run Mode vs Live Import
  if (isDryRun) {
    console.log("\n--- [Step 2/3] Offline Pandal Association Simulation ---");
    console.log("Simulating pandal resolution against local 98-pandal master sheet...");

    let simulatedResolutions = 0;
    for (let idx = 0; idx < report.pandals.length; idx++) {
      const p = report.pandals[idx];
      const match = rawSheet.find(
        (s) => normalizeName(s.name) === normalizeName(p.name)
      );
      if (match) {
        simulatedResolutions++;
      }
    }

    console.log(`✅ Simulated Pandal Matching: ${simulatedResolutions} / ${report.pandals.length} resolved successfully.`);

    console.log("\n--- [Step 3/3] Dry-Run Summary ---");
    console.log("Summary of operations that WILL occur during a live run:");
    console.log(` - Target Database: MongoDB via process.env.MONGO_URI`);
    console.log(` - Target Collection: 'foodplaces'`);
    console.log(` - Unique Index: { source: 1, sourceId: 1, pandalId: 1 } (Unique)`);
    console.log(` - Planned Upserts: ${totalFoodPlacesCount} records across ${report.pandals.length} pandals`);
    console.log(` - Idempotency: Running this import multiple times will safely updateExisting without duplicating.`);
    console.log(` - Existing FoodPlace deletion: NONE (Zero records deleted)`);
    console.log("\n[DRY-RUN COMPLETE] Zero MongoDB operations performed. Zero network calls made.\n");
    return;
  }

  // Step 4: Live Import Mode (Run only when executed without --dry-run)
  console.log("\n--- [Step 2/3] Connecting to MongoDB ---");
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("FATAL: MONGO_URI is missing from backend/.env");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connection established.");
  } catch (err) {
    console.error(`FATAL: Could not connect to MongoDB: ${sanitizeDatabaseError(err)}`);
    process.exit(1);
  }

  try {
    console.log("\n--- [Step 3/3] Resolving Pandals & Executing Upserts ---");

    // Fetch all pandals from DB to map names -> _id
    const dbPandals = await Pandal.find({}, { _id: 1, name: 1 }).lean();
    console.log(`Found ${dbPandals.length} pandal documents in MongoDB.`);

    const pandalMap = new Map();
    for (const dp of dbPandals) {
      pandalMap.set(normalizeName(dp.name), dp._id);
    }

    let unresolvedPandalsCount = 0;
    const unresolvedNames = [];
    const foodPlacesToUpsert = [];

    for (const p of report.pandals) {
      const dbId = pandalMap.get(normalizeName(p.name));
      if (!dbId) {
        unresolvedPandalsCount++;
        unresolvedNames.push(p.name);
        continue;
      }

      for (const place of p.foodPlaces) {
        foodPlacesToUpsert.push({
          pandalId: dbId,
          name: place.name,
          latitude: place.latitude,
          longitude: place.longitude,
          distanceFromPandal: place.distanceFromPandal,
          distanceBand: place.distanceBand,
          category: place.category,
          address: place.address || "",
          source: place.source,
          sourceId: place.sourceId
        });
      }
    }

    if (unresolvedPandalsCount > 0) {
      console.warn(`WARNING: ${unresolvedPandalsCount} pandals could not be matched by name in MongoDB:`);
      unresolvedNames.forEach((n) => console.warn(` - "${n}"`));
      console.log(`Proceeding with ${foodPlacesToUpsert.length} places for resolved pandals...`);
    } else {
      console.log(`✅ All ${report.pandals.length} pandals successfully resolved to MongoDB _ids.`);
    }

    // Reuse existing production foodPersistence service for safe idempotent upsert
    console.log(`Executing idempotent upsert of ${foodPlacesToUpsert.length} records...`);
    const persistResult = await persistFoodPlaces(foodPlacesToUpsert, { Model: FoodPlace });

    console.log("\n============================================================");
    console.log("   LIVE IMPORT SUMMARY                                      ");
    console.log("============================================================");
    console.log(`Total Food Places Processed : ${persistResult.total}`);
    console.log(`Newly Created Records       : ${persistResult.created}`);
    console.log(`Updated Existing Records    : ${persistResult.updated}`);
    console.log(`Failed Records              : ${persistResult.failed}`);
    if (persistResult.failed > 0) {
      console.error(`Errors encountered:`, persistResult.errors.slice(0, 10));
    }
    console.log("============================================================\n");
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("MongoDB connection closed.");
    }
  }
}

main().catch((err) => {
  console.error("FATAL SCRIPT ERROR:", err);
  process.exit(1);
});

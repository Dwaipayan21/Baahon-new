/**
 * Full 98-Pandal 1000-Meter Real Geoapify Live Verification Script
 *
 * CRITICAL SAFETY RULES:
 * - ZERO MONGODB INVOLVEMENT.
 * - DOES NOT IMPORT MONGOOSE.
 * - DOES NOT CONNECT TO DATABASE.
 * - DOES NOT READ/WRITE/SEED MONGODB.
 * - PURE FILE-BASED DISCOVERY AND METRIC REPORTING.
 *
 * Uses production foodDiscovery.service.js directly with radiusMeters: 1000 and limit: 100.
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  discoverFoodNearPandal,
  extractCoordinates,
  assignDistanceBand
} from "../services/food/foodDiscovery.service.js";

const SHEET_PATH = path.join(__dirname, "../data/Baahon_final_sheet.json");
const REPORT_DIR = path.join(__dirname, "../reports");
const REPORT_JSON_PATH = path.join(REPORT_DIR, "foodDiscovery98Results1000m.json");
const REPORT_CSV_PATH = path.join(REPORT_DIR, "foodDiscovery98Results1000m.csv");
const REPORT_SUMMARY_PATH = path.join(REPORT_DIR, "foodDiscovery98Summary1000m.json");

if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

const rawPandals = JSON.parse(fs.readFileSync(SHEET_PATH, "utf-8"));

const REQUEST_DELAY_MS = 350; // Respect Geoapify API rate limits
const DISCOVERY_RADIUS_METERS = 1000;
const DISCOVERY_LIMIT = 100;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeCsvField(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

async function runLiveVerification1000m() {
  console.log("============================================================");
  console.log("   FULL 98-PANDAL 1000-METER GEOAPIFY FOOD DISCOVERY TEST   ");
  console.log("   (Zero MongoDB & Pure File-Based Output)                  ");
  console.log("============================================================\n");

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    console.error("FATAL: GEOAPIFY_API_KEY is not defined in backend/.env");
    process.exit(1);
  }

  console.log(`Loaded ${rawPandals.length} pandals from Baahon_final_sheet.json.`);
  console.log(`Target Discovery Radius: ${DISCOVERY_RADIUS_METERS}m.`);
  console.log(`Discovery Limit per request: ${DISCOVERY_LIMIT}.`);
  console.log(`Delay between requests: ${REQUEST_DELAY_MS}ms.\n`);

  const startTime = Date.now();
  const pandalResults = [];
  const allDiscoveredPlaces = [];

  let successfulWithResults = 0;
  let successfulZeroResults = 0;
  let failedCount = 0;
  let totalPlacesDiscovered = 0;
  let rateLimitEvents = 0;
  let totalApiErrors = 0;
  let invalidPlacesCount = 0;
  let duplicatesDetected = 0;

  for (let idx = 0; idx < rawPandals.length; idx++) {
    const raw = rawPandals[idx];
    const pandalIndex = idx;
    const pandalName = raw.name || `Pandal ${idx + 1}`;
    const coords = extractCoordinates(raw);

    const pandalObj = {
      ...raw,
      id: `pandal-${idx}`
    };

    if (!coords) {
      console.log(`[${idx + 1}/98] ${pandalName} -> FAILED: Invalid Coordinates`);
      failedCount++;
      pandalResults.push({
        index: idx,
        name: pandalName,
        latitude: null,
        longitude: null,
        status: "FAILED",
        foodCount: 0,
        error: "Invalid or missing coordinates",
        foodPlaces: []
      });
      continue;
    }

    try {
      const outcome = await discoverFoodNearPandal(pandalObj, {
        radiusMeters: DISCOVERY_RADIUS_METERS,
        limit: DISCOVERY_LIMIT,
        apiKey: apiKey
      });

      if (!outcome.success) {
        totalApiErrors++;
        if (outcome.error && (outcome.error.includes("429") || outcome.error.toLowerCase().includes("rate limit"))) {
          rateLimitEvents++;
        }
        console.log(`[${idx + 1}/98] ${pandalName} -> FAILED: ${outcome.error}`);
        failedCount++;
        pandalResults.push({
          index: idx,
          name: pandalName,
          latitude: coords.lat,
          longitude: coords.lng,
          status: "FAILED",
          foodCount: 0,
          error: outcome.error,
          foodPlaces: []
        });
      } else {
        const places = outcome.places || [];
        const validatedPlaces = [];
        const seenSourceIds = new Set();

        for (const place of places) {
          const hasName = Boolean(place.name && place.name.trim());
          const hasCoords = Number.isFinite(place.latitude) && Number.isFinite(place.longitude);
          const hasDist = Number.isFinite(place.distanceFromPandal);
          const validDistRange = hasDist && place.distanceFromPandal <= DISCOVERY_RADIUS_METERS + 50;
          const expectedBand = assignDistanceBand(place.distanceFromPandal);
          const validBand = place.distanceBand === expectedBand;
          const validCategory = Boolean(place.category);
          const hasSource = place.source === "geoapify";
          const hasSourceId = Boolean(place.sourceId);

          if (!hasName || !hasCoords || !hasDist || !validDistRange || !validBand || !validCategory || !hasSource || !hasSourceId) {
            invalidPlacesCount++;
            continue;
          }

          if (seenSourceIds.has(place.sourceId)) {
            duplicatesDetected++;
            continue;
          }
          seenSourceIds.add(place.sourceId);

          const placeRecord = {
            pandalIndex: idx,
            pandalName: pandalName,
            name: place.name,
            latitude: place.latitude,
            longitude: place.longitude,
            distanceFromPandal: place.distanceFromPandal,
            distanceBand: place.distanceBand,
            category: place.category,
            address: place.address || "",
            source: place.source,
            sourceId: place.sourceId
          };

          validatedPlaces.push(placeRecord);
          allDiscoveredPlaces.push(placeRecord);
        }

        totalPlacesDiscovered += validatedPlaces.length;

        if (validatedPlaces.length === 0) {
          successfulZeroResults++;
          console.log(`[${idx + 1}/98] ${pandalName} -> ZERO_RESULTS (0 places within ${DISCOVERY_RADIUS_METERS}m)`);
          pandalResults.push({
            index: idx,
            name: pandalName,
            latitude: coords.lat,
            longitude: coords.lng,
            status: "ZERO_RESULTS",
            foodCount: 0,
            error: null,
            foodPlaces: []
          });
        } else {
          successfulWithResults++;
          console.log(`[${idx + 1}/98] ${pandalName} -> SUCCESS (${validatedPlaces.length} places)`);
          pandalResults.push({
            index: idx,
            name: pandalName,
            latitude: coords.lat,
            longitude: coords.lng,
            status: "SUCCESS_WITH_RESULTS",
            foodCount: validatedPlaces.length,
            error: null,
            foodPlaces: validatedPlaces
          });
        }
      }
    } catch (err) {
      failedCount++;
      totalApiErrors++;
      console.log(`[${idx + 1}/98] ${pandalName} -> EXCEPTION: ${err.message}`);
      pandalResults.push({
        index: idx,
        name: pandalName,
        latitude: coords.lat,
        longitude: coords.lng,
        status: "FAILED",
        foodCount: 0,
        error: err.message,
        foodPlaces: []
      });
    }

    if (idx < rawPandals.length - 1 && REQUEST_DELAY_MS > 0) {
      await delay(REQUEST_DELAY_MS);
    }
  }

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  const foodCountsOnly = pandalResults.map((p) => p.foodCount).filter((c) => c > 0);
  const minFood = foodCountsOnly.length > 0 ? Math.min(...foodCountsOnly) : 0;
  const maxFood = foodCountsOnly.length > 0 ? Math.max(...foodCountsOnly) : 0;
  const avgFood = rawPandals.length > 0 ? Number((totalPlacesDiscovered / rawPandals.length).toFixed(2)) : 0;

  const bandCounts = {
    very_nearby: 0,
    nearby: 0,
    further: 0,
    beyond_1000m: 0
  };

  const categoryCounts = {};

  for (const place of allDiscoveredPlaces) {
    if (bandCounts[place.distanceBand] !== undefined) {
      bandCounts[place.distanceBand]++;
    } else {
      bandCounts[place.distanceBand] = 1;
    }

    categoryCounts[place.category] = (categoryCounts[place.category] || 0) + 1;
  }

  const sortedPandals = [...pandalResults].sort((a, b) => b.foodCount - a.foodCount);
  const top20Pandals = sortedPandals.slice(0, 20).map((p, rank) => ({
    rank: rank + 1,
    pandalIndex: p.index,
    pandalName: p.name,
    latitude: p.latitude,
    longitude: p.longitude,
    foodCount: p.foodCount
  }));

  const zeroResultPandals = pandalResults
    .filter((p) => p.foodCount === 0)
    .map((p) => ({
      pandalIndex: p.index,
      pandalName: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      status: p.status
    }));

  const fullJsonReport = {
    generatedAt: new Date().toISOString(),
    executionDurationSeconds: durationSec,
    discoveryRadiusMeters: DISCOVERY_RADIUS_METERS,
    discoveryLimitRequested: DISCOVERY_LIMIT,
    totalPandalsAttempted: rawPandals.length,
    successfulWithResults,
    successfulWithZeroResults: successfulZeroResults,
    failedPandals: failedCount,
    totalFoodPlacesDiscovered: totalPlacesDiscovered,
    averageFoodPlacesPerPandal: avgFood,
    minFoodPlacesForSuccessfulPandal: minFood,
    maxFoodPlacesForPandal: maxFood,
    duplicatesDetected,
    invalidPlacesRemoved: invalidPlacesCount,
    apiErrors: totalApiErrors,
    rateLimitEvents,
    distanceBandBreakdown: bandCounts,
    categoryBreakdown: categoryCounts,
    top20Pandals,
    zeroResultPandals,
    pandals: pandalResults
  };

  fs.writeFileSync(REPORT_JSON_PATH, JSON.stringify(fullJsonReport, null, 2), "utf-8");
  console.log(`\n1. Full JSON Report written to: ${REPORT_JSON_PATH}`);

  const summaryJsonReport = {
    generatedAt: fullJsonReport.generatedAt,
    executionDurationSeconds: durationSec,
    discoveryRadiusMeters: DISCOVERY_RADIUS_METERS,
    discoveryLimitRequested: DISCOVERY_LIMIT,
    totalPandalsAttempted: rawPandals.length,
    successfulWithResults,
    successfulWithZeroResults: successfulZeroResults,
    failedPandals: failedCount,
    totalFoodPlacesDiscovered: totalPlacesDiscovered,
    averageFoodPlacesPerPandal: avgFood,
    minFoodPlacesForSuccessfulPandal: minFood,
    maxFoodPlacesForPandal: maxFood,
    distanceBandBreakdown: bandCounts,
    categoryBreakdown: categoryCounts,
    top20Pandals,
    zeroResultCount: zeroResultPandals.length,
    zeroResultPandals
  };

  fs.writeFileSync(REPORT_SUMMARY_PATH, JSON.stringify(summaryJsonReport, null, 2), "utf-8");
  console.log(`2. Summary JSON Report written to: ${REPORT_SUMMARY_PATH}`);

  const csvHeaders = [
    "PandalIndex",
    "PandalName",
    "PlaceName",
    "Category",
    "DistanceMeters",
    "DistanceBand",
    "Latitude",
    "Longitude",
    "Address",
    "SourceId"
  ];

  const csvRows = [csvHeaders.join(",")];

  for (const p of pandalResults) {
    if (p.foodPlaces.length === 0) {
      csvRows.push([
        p.index,
        escapeCsvField(p.name),
        escapeCsvField("(No food places within 1000m)"),
        '""',
        '""',
        '""',
        p.latitude !== null ? p.latitude : '""',
        p.longitude !== null ? p.longitude : '""',
        '""',
        '""'
      ].join(","));
    } else {
      for (const place of p.foodPlaces) {
        csvRows.push([
          p.index,
          escapeCsvField(p.name),
          escapeCsvField(place.name),
          escapeCsvField(place.category),
          place.distanceFromPandal,
          escapeCsvField(place.distanceBand),
          place.latitude,
          place.longitude,
          escapeCsvField(place.address),
          escapeCsvField(place.sourceId)
        ].join(","));
      }
    }
  }

  fs.writeFileSync(REPORT_CSV_PATH, csvRows.join("\n"), "utf-8");
  console.log(`3. CSV Report written to: ${REPORT_CSV_PATH}`);

  console.log("\n============================================================");
  console.log(`Execution completed in ${durationSec}s.`);
  console.log(`Total Food Places Discovered: ${totalPlacesDiscovered}`);
  console.log(`Pandals with Results: ${successfulWithResults} / ${rawPandals.length}`);
  console.log(`Pandals with Zero Results: ${successfulZeroResults} / ${rawPandals.length}`);
  console.log("============================================================\n");
}

runLiveVerification1000m().catch((err) => {
  console.error("FATAL SCRIPT ERROR:", err);
  process.exit(1);
});

/**
 * Manual Test Script: Food Discovery + Persistence Workflow (Phase 2C-3)
 * 
 * Explicitly tests discovering and upserting food places for 1-2 known pandals into MongoDB.
 * 
 * Development/verification script only.
 * Never runs automatically on server startup or normal test suites.
 * 
 * Usage:
 *   node scripts/testFoodDiscoveryPersistence.js
 *   npm run test:food:persistence
 */

const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");

// Safe dotenv loading with zero-dependency fallback
try {
  require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
} catch {
  const envPath = path.resolve(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

const Pandal = require("../models/pandal.model.js");
const FoodPlace = require("../models/foodPlace.model.js");
const { discoverAndPersistFoodForPandals } = require("../services/foodDiscoveryPersistence.service.js");

function maskKey(key) {
  if (!key || key.length < 8) return "****";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

async function runManualTest() {
  console.log("=".repeat(75));
  console.log("       MANUAL TEST: FOOD DISCOVERY + PERSISTENCE WORKFLOW");
  console.log("=".repeat(75));

  const apiKey = process.env.GEOAPIFY_API_KEY;
  const mongoUri = process.env.MONGO_URI;

  console.log(`API Key Status: ${apiKey ? `Configured (${maskKey(apiKey)})` : "NOT CONFIGURED"}`);
  console.log(`MongoDB URI   : ${mongoUri ? "Configured" : "NOT CONFIGURED"}\n`);

  if (!apiKey || !mongoUri) {
    console.log("⚠️  Cannot run live persistence test without GEOAPIFY_API_KEY and MONGO_URI.");
    return;
  }

  // Connect to MongoDB
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");

  try {
    // Select 1-2 known pandals from MongoDB
    const testPandals = [];
    const ekdalia = await Pandal.findOne({ name: /Ekdalia/i });
    if (ekdalia) testPandals.push(ekdalia);

    const collegeSquare = await Pandal.findOne({ name: /College Square/i });
    if (collegeSquare) testPandals.push(collegeSquare);

    if (testPandals.length === 0) {
      const firstTwo = await Pandal.find().limit(2);
      testPandals.push(...firstTwo);
    }

    console.log(`Selected ${testPandals.length} pandals for live discovery + persistence:`);
    testPandals.forEach((p, idx) => {
      console.log(`  ${idx + 1}. ${p.name} (ID: ${p._id})`);
    });
    console.log("-".repeat(75));

    const initialTotalCount = await FoodPlace.countDocuments();
    console.log(`Initial total FoodPlace documents in DB: ${initialTotalCount}`);

    console.log("\nExecuting discoverAndPersistFoodForPandals (sequential)...");
    const summary = await discoverAndPersistFoodForPandals(testPandals, {
      radiusMeters: 500,
      limit: 10,
      requestDelayMs: 250
    });

    console.log("\nWorkflow Execution Summary:");
    console.log(`  Total Pandals Processed : ${summary.totalPandals}`);
    console.log(`  Successful Pandals      : ${summary.successfulPandals}`);
    console.log(`  Failed Pandals          : ${summary.failedPandals}`);
    console.log(`  Total POIs Discovered   : ${summary.totalDiscovered}`);
    console.log(`  Total Created (New)     : ${summary.totalCreated}`);
    console.log(`  Total Updated (Existing): ${summary.totalUpdated}`);

    if (summary.errors.length > 0) {
      console.log("\nErrors encountered:");
      summary.errors.forEach((e) => console.log(`  - [${e.pandalName}] ${e.error}`));
    }

    const finalTotalCount = await FoodPlace.countDocuments();
    console.log(`\nFinal total FoodPlace documents in DB: ${finalTotalCount}`);

    // Verify idempotency by running the exact same pandals a second time
    console.log("\nTesting Idempotency: Re-running workflow for same pandals...");
    const secondRun = await discoverAndPersistFoodForPandals(testPandals, {
      radiusMeters: 500,
      limit: 10,
      requestDelayMs: 250
    });

    console.log(`  Second run created: ${secondRun.totalCreated} (Expected 0)`);
    console.log(`  Second run updated: ${secondRun.totalUpdated}`);

    const idempotentCount = await FoodPlace.countDocuments();
    console.log(`  FoodPlace document count after second run: ${idempotentCount}`);

    if (idempotentCount === finalTotalCount && secondRun.totalCreated === 0) {
      console.log("  ✅ IDEMPOTENCY VERIFIED: No duplicate records created on repeated execution.");
    }

    console.log("=".repeat(75));
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed cleanly.");
  }
}

runManualTest().catch((err) => {
  console.error("Manual test execution error:", err.message);
  process.exit(1);
});

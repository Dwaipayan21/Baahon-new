/**
 * Unit Tests for FoodPlace Mongoose Model (Phase 2C-1)
 * 
 * Deterministic, offline schema validation and index tests.
 * Zero network or database server requirements.
 */

const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const FoodPlace = require("../models/foodPlace.model.js");

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

function runTests() {
  console.log("\n--- Running Unit Tests for FoodPlace Mongoose Model ---\n");

  const samplePandalId = new mongoose.Types.ObjectId();

  const validPayload = {
    pandalId: samplePandalId,
    name: "Paramount Juices & Shakes",
    latitude: 22.5735,
    longitude: 88.3639,
    distanceFromPandal: 158,
    distanceBand: "very_nearby",
    category: "cafe",
    address: "Bankim Chatterjee Street, Kolkata",
    source: "geoapify",
    sourceId: "place_paramount_001",
  };

  // 1. Valid document validation
  test("Valid FoodPlace document passes validation", () => {
    const doc = new FoodPlace(validPayload);
    const error = doc.validateSync();
    assert.equal(error, undefined, "Expected valid document to have no validation errors");
  });

  // 2. Missing required fields
  test("Missing required fields fail validation", () => {
    const emptyDoc = new FoodPlace({});
    const error = emptyDoc.validateSync();
    assert.ok(error, "Expected validation error for empty document");

    const requiredFields = [
      "pandalId",
      "name",
      "latitude",
      "longitude",
      "distanceFromPandal",
      "distanceBand",
      "category",
      "sourceId",
    ];

    for (const field of requiredFields) {
      assert.ok(
        error.errors[field],
        `Expected error for missing required field: ${field}`
      );
    }
  });

  // 3. Invalid latitude and longitude boundaries
  test("Invalid latitude/longitude fail validation", () => {
    // Latitude > 90
    const invalidLatDoc = new FoodPlace({ ...validPayload, latitude: 91.5 });
    const latError = invalidLatDoc.validateSync();
    assert.ok(latError?.errors?.latitude, "Expected latitude > 90 to fail");

    // Latitude < -90
    const invalidLatMinDoc = new FoodPlace({ ...validPayload, latitude: -95 });
    const latMinError = invalidLatMinDoc.validateSync();
    assert.ok(latMinError?.errors?.latitude, "Expected latitude < -90 to fail");

    // Longitude > 180
    const invalidLngDoc = new FoodPlace({ ...validPayload, longitude: 185 });
    const lngError = invalidLngDoc.validateSync();
    assert.ok(lngError?.errors?.longitude, "Expected longitude > 180 to fail");

    // Longitude < -180
    const invalidLngMinDoc = new FoodPlace({ ...validPayload, longitude: -185 });
    const lngMinError = invalidLngMinDoc.validateSync();
    assert.ok(lngMinError?.errors?.longitude, "Expected longitude < -180 to fail");
  });

  // 4. Negative distanceFromPandal
  test("Negative distanceFromPandal fails validation", () => {
    const negativeDistDoc = new FoodPlace({ ...validPayload, distanceFromPandal: -10 });
    const error = negativeDistDoc.validateSync();
    assert.ok(error?.errors?.distanceFromPandal, "Expected negative distance to fail");

    // Zero distance should pass
    const zeroDistDoc = new FoodPlace({ ...validPayload, distanceFromPandal: 0 });
    assert.equal(zeroDistDoc.validateSync(), undefined, "Expected 0m distance to pass");
  });

  // 5. Invalid distanceBand enum
  test("Invalid distanceBand fails validation while all valid bands pass", () => {
    const invalidBandDoc = new FoodPlace({ ...validPayload, distanceBand: "invalid_band" });
    const error = invalidBandDoc.validateSync();
    assert.ok(error?.errors?.distanceBand, "Expected invalid distanceBand to fail");

    const validBands = ["very_nearby", "nearby", "further", "beyond_1000m", "unknown"];
    for (const band of validBands) {
      const doc = new FoodPlace({ ...validPayload, distanceBand: band });
      assert.equal(doc.validateSync(), undefined, `Expected distanceBand "${band}" to pass`);
    }
  });

  // 6. Compound unique index & pandalId index definitions
  test("Indexes exist for { source, sourceId, pandalId } unique and { pandalId }", () => {
    const indexes = FoodPlace.schema.indexes();
    assert.ok(Array.isArray(indexes), "Expected schema indexes array");

    // Check compound unique index: { source: 1, sourceId: 1, pandalId: 1 }
    const compoundIndex = indexes.find(
      ([fields, options]) =>
        fields.source === 1 &&
        fields.sourceId === 1 &&
        fields.pandalId === 1 &&
        options?.unique === true
    );
    assert.ok(compoundIndex, "Expected unique compound index { source: 1, sourceId: 1, pandalId: 1 }");

    // Check pandalId index
    const pandalIndex = indexes.find(
      ([fields]) => fields.pandalId === 1 && Object.keys(fields).length === 1
    );
    assert.ok(pandalIndex, "Expected index on { pandalId: 1 }");
  });

  // 7. Timestamps configuration
  test("Timestamps are enabled in schema options and paths exist", () => {
    assert.equal(FoodPlace.schema.options.timestamps, true, "Expected timestamps to be true");
    assert.ok(FoodPlace.schema.paths.createdAt, "Expected createdAt path in schema");
    assert.ok(FoodPlace.schema.paths.updatedAt, "Expected updatedAt path in schema");
  });

  console.log("\n========================================");
  if (process.exitCode) {
    console.log("❌ Some FoodPlace model tests failed.");
    process.exit(1);
  } else {
    console.log("FoodPlace Model Unit Tests: ALL 7 TESTS PASSED");
    console.log("========================================\n");
    process.exit(0);
  }
}

runTests();

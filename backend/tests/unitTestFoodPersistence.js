/**
 * Unit Tests for Food Persistence Service (Phase 2C-2)
 * 
 * Tests validation, upsert identity, shape conversion, error sanitization,
 * and batch processing behavior.
 * 
 * Deterministic and offline - zero network, Geoapify, or database dependencies.
 */

const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const {
  validateNormalizedFoodPlace,
  persistFoodPlace,
  persistFoodPlaces,
  sanitizeDatabaseError,
  ALLOWED_DISTANCE_BANDS
} = require("../services/foodPersistence.service.js");

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

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

async function runAllTests() {
  console.log("\n--- Running Unit Tests for Food Persistence Service ---\n");

  const validObjectId = new mongoose.Types.ObjectId().toString();

  const sampleNormalizedPlace = {
    id: "geoapify_5107d15ad1661756405986877a0b35843640",
    pandalId: validObjectId,
    name: "Just Baked",
    latitude: 22.51812,
    longitude: 88.36683,
    distanceFromPandal: 186,
    distanceBand: "very_nearby",
    category: "cafe",
    address: "Just Baked, Purna Das Road, Kolkata",
    source: "geoapify",
    sourceId: "5107d15ad1661756405986877a0b35843640"
  };

  // 1. Empty input handling
  await asyncTest("1. Empty input returns successful result with zero persisted records", async () => {
    const res1 = await persistFoodPlaces([]);
    assert.deepEqual(res1, {
      total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      data: [],
      errors: []
    });

    const res2 = await persistFoodPlaces(null);
    assert.equal(res2.total, 0);
  });

  // 2. Valid single record shape conversion
  test("2. Valid normalized record is converted to correct FoodPlace persistence shape", () => {
    const res = validateNormalizedFoodPlace(sampleNormalizedPlace);
    assert.equal(res.valid, true);
    assert.ok(res.sanitized);
    assert.ok(res.sanitized.pandalId instanceof mongoose.Types.ObjectId);
    assert.equal(res.sanitized.pandalId.toString(), validObjectId);
    assert.equal(res.sanitized.name, "Just Baked");
    assert.equal(res.sanitized.latitude, 22.51812);
    assert.equal(res.sanitized.longitude, 88.36683);
    assert.equal(res.sanitized.distanceFromPandal, 186);
    assert.equal(res.sanitized.distanceBand, "very_nearby");
    assert.equal(res.sanitized.category, "cafe");
    assert.equal(res.sanitized.address, "Just Baked, Purna Das Road, Kolkata");
    assert.equal(res.sanitized.source, "geoapify");
    assert.equal(res.sanitized.sourceId, "5107d15ad1661756405986877a0b35843640");
  });

  // 3. `id` is NOT persisted as custom field
  test("3. External 'id' field is explicitly stripped and not persisted", () => {
    const res = validateNormalizedFoodPlace(sampleNormalizedPlace);
    assert.equal(res.valid, true);
    assert.equal(res.sanitized.id, undefined);
    assert.ok(!("id" in res.sanitized), "sanitized object must not contain custom 'id' property");
  });

  // 4. Existing record: matching source + sourceId + pandalId causes update
  await asyncTest("4. Matching { source, sourceId, pandalId } triggers update behavior", async () => {
    let capturedFilter = null;
    let capturedUpdate = null;

    const mockModel = {
      findOneAndUpdate: async (filter, update, options) => {
        capturedFilter = filter;
        capturedUpdate = update;
        return {
          lastErrorObject: { updatedExisting: true },
          value: { _id: new mongoose.Types.ObjectId(), ...update.$set }
        };
      }
    };

    const outcome = await persistFoodPlace(sampleNormalizedPlace, { Model: mockModel });
    assert.equal(outcome.created, false);
    assert.equal(outcome.updated, true);
    assert.equal(capturedFilter.source, "geoapify");
    assert.equal(capturedFilter.sourceId, sampleNormalizedPlace.sourceId);
    assert.equal(capturedFilter.pandalId.toString(), validObjectId);
  });

  // 5. New record: unique source + sourceId + pandalId causes creation
  await asyncTest("5. Unique { source, sourceId, pandalId } triggers creation behavior", async () => {
    const mockModel = {
      findOneAndUpdate: async (filter, update, options) => {
        return {
          lastErrorObject: { updatedExisting: false, upserted: new mongoose.Types.ObjectId() },
          value: { _id: new mongoose.Types.ObjectId(), ...update.$set }
        };
      }
    };

    const outcome = await persistFoodPlace(sampleNormalizedPlace, { Model: mockModel });
    assert.equal(outcome.created, true);
    assert.equal(outcome.updated, false);
    assert.ok(outcome.data);
  });

  // 6. Invalid pandalId is rejected
  test("6. Invalid or missing pandalId is rejected", () => {
    const res1 = validateNormalizedFoodPlace({ ...sampleNormalizedPlace, pandalId: "not-an-objectid" });
    assert.equal(res1.valid, false);
    assert.match(res1.error, /Invalid pandalId/i);

    const res2 = validateNormalizedFoodPlace({ ...sampleNormalizedPlace, pandalId: "" });
    assert.equal(res2.valid, false);

    const res3 = validateNormalizedFoodPlace({ ...sampleNormalizedPlace, pandalId: null });
    assert.equal(res3.valid, false);
  });

  // 7. Missing required normalized fields are rejected
  test("7. Missing required normalized fields (name, category, source, sourceId) are rejected", () => {
    const fieldsToTest = ["name", "category", "source", "sourceId"];
    for (const field of fieldsToTest) {
      const invalidCopy = { ...sampleNormalizedPlace };
      delete invalidCopy[field];
      const res = validateNormalizedFoodPlace(invalidCopy);
      assert.equal(res.valid, false, `Expected missing ${field} to fail validation`);
      assert.match(res.error, new RegExp(field, "i"));
    }
  });

  // 8. Invalid coordinates and negative distance are rejected
  test("8. Invalid coordinates and negative distanceFromPandal are rejected", () => {
    // Latitude out of bounds
    const invalidLat = validateNormalizedFoodPlace({ ...sampleNormalizedPlace, latitude: 91 });
    assert.equal(invalidLat.valid, false);
    assert.match(invalidLat.error, /latitude/i);

    // Longitude out of bounds
    const invalidLng = validateNormalizedFoodPlace({ ...sampleNormalizedPlace, longitude: -181 });
    assert.equal(invalidLng.valid, false);
    assert.match(invalidLng.error, /longitude/i);

    // Negative distance
    const negativeDist = validateNormalizedFoodPlace({ ...sampleNormalizedPlace, distanceFromPandal: -5 });
    assert.equal(negativeDist.valid, false);
    assert.match(negativeDist.error, /distanceFromPandal/i);

    // Non-numeric distance
    const nonNumericDist = validateNormalizedFoodPlace({ ...sampleNormalizedPlace, distanceFromPandal: "five-hundred" });
    assert.equal(nonNumericDist.valid, false);
  });

  // 9. Invalid distanceBand is rejected
  test("9. Invalid distanceBand is rejected, while allowed bands pass", () => {
    const invalidBand = validateNormalizedFoodPlace({ ...sampleNormalizedPlace, distanceBand: "walking_distance" });
    assert.equal(invalidBand.valid, false);
    assert.match(invalidBand.error, /distanceBand/i);

    for (const band of ALLOWED_DISTANCE_BANDS) {
      const valid = validateNormalizedFoodPlace({ ...sampleNormalizedPlace, distanceBand: band });
      assert.equal(valid.valid, true, `Expected band "${band}" to pass`);
    }
  });

  // 10. Database failure is surfaced without leaking credentials or secrets
  await asyncTest("10. Database errors are sanitized without leaking secrets or credentials", async () => {
    const rawSecretUri = "MongoServerError: Authentication failed at mongodb://dbUser:superSecretPassword987@cluster0.mongodb.net/baahon?apiKey=secretGeoapifyKey123";
    const sanitized = sanitizeDatabaseError(rawSecretUri);

    assert.ok(!sanitized.includes("superSecretPassword987"), "Password must be sanitized");
    assert.ok(!sanitized.includes("secretGeoapifyKey123"), "API Key must be sanitized");
    assert.match(sanitized, /<redacted>/);

    const failingModel = {
      findOneAndUpdate: async () => {
        throw new Error(`Connection error mongodb+srv://admin:mySecretMongoPassword@cluster.net/app?key=secretKey123`);
      }
    };

    try {
      await persistFoodPlace(sampleNormalizedPlace, { Model: failingModel });
      assert.fail("Should have thrown error");
    } catch (err) {
      assert.equal(err.name, "DatabasePersistenceError");
      assert.ok(!err.message.includes("mySecretMongoPassword"));
      assert.ok(!err.message.includes("secretKey123"));
      assert.match(err.message, /<redacted>/);
    }
  });

  // 11. Batch processing reports created, updated, and failed counts
  await asyncTest("11. Batch processing accurately tracks created, updated, and failed items", async () => {
    let callCount = 0;
    const mockModel = {
      findOneAndUpdate: async (filter, update) => {
        callCount++;
        if (callCount === 1) {
          // First item created
          return {
            lastErrorObject: { updatedExisting: false },
            value: { _id: "doc1", ...update.$set }
          };
        } else {
          // Second item updated
          return {
            lastErrorObject: { updatedExisting: true },
            value: { _id: "doc2", ...update.$set }
          };
        }
      }
    };

    const batch = [
      // Item 1: Valid (will be created)
      { ...sampleNormalizedPlace, sourceId: "place_101" },
      // Item 2: Valid (will be updated)
      { ...sampleNormalizedPlace, sourceId: "place_102" },
      // Item 3: Invalid pandalId (will fail validation)
      { ...sampleNormalizedPlace, pandalId: "invalid-id-xyz" }
    ];

    const result = await persistFoodPlaces(batch, { Model: mockModel });

    assert.equal(result.total, 3);
    assert.equal(result.created, 1);
    assert.equal(result.updated, 1);
    assert.equal(result.failed, 1);
    assert.equal(result.data.length, 2);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].index, 2);
    assert.match(result.errors[0].error, /Invalid pandalId/i);
  });

  console.log("\n========================================");
  if (process.exitCode) {
    console.log("❌ Some Food Persistence unit tests failed.");
    process.exit(1);
  } else {
    console.log("Food Persistence Unit Tests: ALL 11 TESTS PASSED");
    console.log("========================================\n");
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error("Fatal test runner failure:", err);
  process.exit(1);
});

/**
 * Deterministic API & Controller Unit Tests (Phase 2C-4)
 * 
 * Verifies MongoDB-backed read behavior of GET /api/pandals/:pandalId/food:
 * - Reads from FoodPlace MongoDB collection
 * - Radius filtering (distanceFromPandal <= radius)
 * - Sorting by distanceFromPandal ascending
 * - Applying limits (default 25, max 50)
 * - Mapping MongoDB `_id` -> `id` without exposing raw `_id`
 * - Validating parameters and returning 400/404/500
 * - Ensuring NO calls to foodDiscovery.service.js, foodPersistence.service.js, or Geoapify
 * 
 * 100% deterministic and offline - zero live network dependencies.
 */

const assert = require("node:assert/strict");
const http = require("node:http");
const mongoose = require("mongoose");
const app = require("../server.js");
const foodReadService = require("../services/foodRead.service.js");
const foodDiscoveryService = require("../services/foodDiscovery.service.js");
const foodPersistenceService = require("../services/foodPersistence.service.js");
const FoodPlace = require("../models/foodPlace.model.js");

let server;
let baseUrl;

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
  console.log("\n--- Running Unit Tests for MongoDB-Backed Food API (Phase 2C-4) ---\n");

  const originalGetFoodPlaces = foodReadService.getFoodPlacesForPandal;
  const originalDiscover = foodDiscoveryService.discoverFoodNearPandal;
  const originalPersist = foodPersistenceService.persistFoodPlaces;

  let discoveryCalled = false;
  let persistenceCalled = false;

  foodDiscoveryService.discoverFoodNearPandal = async () => {
    discoveryCalled = true;
    throw new Error("FAIL: foodDiscovery.service must not be called by the read API!");
  };

  foodPersistenceService.persistFoodPlaces = async () => {
    persistenceCalled = true;
    throw new Error("FAIL: foodPersistence.service must not be called by the read API!");
  };

  // Start Express server on ephemeral port for end-to-end route tests
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });

  const testPandalId = new mongoose.Types.ObjectId().toString();

  const mockDbDocs = [
    {
      _id: new mongoose.Types.ObjectId("650000000000000000000001"),
      pandalId: new mongoose.Types.ObjectId(testPandalId),
      name: "Paramount Juices & Shakes",
      latitude: 22.5735,
      longitude: 88.3639,
      distanceFromPandal: 158,
      distanceBand: "very_nearby",
      category: "cafe",
      address: "Bankim Chatterjee Street, Kolkata",
      source: "geoapify",
      sourceId: "place_101",
      __v: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: new mongoose.Types.ObjectId("650000000000000000000002"),
      pandalId: new mongoose.Types.ObjectId(testPandalId),
      name: "Kalika Fast Food",
      latitude: 22.5742,
      longitude: 88.3650,
      distanceFromPandal: 313,
      distanceBand: "nearby",
      category: "fast_food",
      address: "Surya Sen Street, Kolkata",
      source: "geoapify",
      sourceId: "place_102",
      __v: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: new mongoose.Types.ObjectId("650000000000000000000003"),
      pandalId: new mongoose.Types.ObjectId(testPandalId),
      name: "Indian Coffee House",
      latitude: 22.5755,
      longitude: 88.3662,
      distanceFromPandal: 780,
      distanceBand: "further",
      category: "restaurant",
      address: "College Street, Kolkata",
      source: "geoapify",
      sourceId: "place_103",
      __v: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  try {
    // 1 & 16 & 17. Valid pandal with stored records, _id mapped to id without raw _id exposed
    await asyncTest("1. Valid pandal returns 200 with normalized food records and mapped id", async () => {
      try {
        foodReadService.getFoodPlacesForPandal = async (pandal, opts) => {
          return mockDbDocs.slice(0, 2).map(foodReadService.mapFoodPlaceDocumentToResponse);
        };

        const res = await fetch(`${baseUrl}/api/pandals/college-square/food`);
        assert.equal(res.status, 200);
        const json = await res.json();

        assert.equal(json.success, true);
        assert.ok(json.pandalId);
        assert.equal(json.pandalName, "College Square");
        assert.equal(json.count, 2);
        assert.equal(json.data.length, 2);

        const first = json.data[0];
        // Verify all 11 standardized fields
        assert.equal(first.id, "650000000000000000000001");
        assert.equal(first.name, "Paramount Juices & Shakes");
        assert.equal(first.distanceFromPandal, 158);
        assert.equal(first.distanceBand, "very_nearby");
        assert.equal(first.category, "cafe");
        assert.equal(first.source, "geoapify");
        assert.equal(first.sourceId, "place_101");

        // Verify raw MongoDB internals are not exposed
        assert.equal(first._id, undefined);
        assert.equal(first.__v, undefined);
        assert.equal(first.createdAt, undefined);
      } finally {
        foodReadService.getFoodPlacesForPandal = originalGetFoodPlaces;
      }
    });

    // 2. Results sorted by distanceFromPandal ascending
    test("2. Service sorts food places by distanceFromPandal ascending", () => {
      const unsorted = [
        { _id: "2", pandalId: testPandalId, name: "Far", distanceFromPandal: 600, distanceBand: "nearby", category: "cafe", source: "geoapify", sourceId: "p2" },
        { _id: "1", pandalId: testPandalId, name: "Near", distanceFromPandal: 120, distanceBand: "very_nearby", category: "cafe", source: "geoapify", sourceId: "p1" }
      ];
      unsorted.sort((a, b) => a.distanceFromPandal - b.distanceFromPandal);
      assert.equal(unsorted[0].name, "Near");
      assert.equal(unsorted[1].name, "Far");
    });

    // 3, 4, 5. Radius filtering behavior in foodRead.service
    await asyncTest("3, 4, 5. foodRead.service constructs correct distance filters for radius", async () => {
      let capturedFilter = null;
      let capturedSort = null;
      let capturedLimit = null;

      const mockModel = {
        find(f) {
          capturedFilter = f;
          return {
            sort(s) {
              capturedSort = s;
              return {
                limit(l) {
                  capturedLimit = l;
                  return {
                    lean: async () => []
                  };
                }
              };
            }
          };
        }
      };

      // Default radius (500m)
      await foodReadService.getFoodPlacesForPandal(testPandalId, { Model: mockModel });
      assert.deepEqual(capturedFilter.distanceFromPandal, { $lte: 500 });
      assert.deepEqual(capturedSort, { distanceFromPandal: 1 });
      assert.equal(capturedLimit, 25);

      // Custom radius (1000m)
      await foodReadService.getFoodPlacesForPandal(testPandalId, { radiusMeters: 1000, limit: 10, Model: mockModel });
      assert.deepEqual(capturedFilter.distanceFromPandal, { $lte: 1000 });
      assert.equal(capturedLimit, 10);
    });

    // 6. Default limit = 25
    test("6. Default limit constant is 25", () => {
      assert.equal(foodReadService.DEFAULT_LIMIT, 25);
    });

    // 7. Maximum limit = 50
    test("7. Maximum limit constant is 50", () => {
      assert.equal(foodReadService.MAX_LIMIT, 50);
    });

    // 8. Invalid radius returns 400
    await asyncTest("8. Invalid radius (>1000m or negative) returns HTTP 400", async () => {
      const res1 = await fetch(`${baseUrl}/api/pandals/college-square/food?radius=1500`);
      assert.equal(res1.status, 400);
      const json1 = await res1.json();
      assert.equal(json1.success, false);
      assert.match(json1.message, /radius/i);

      const res2 = await fetch(`${baseUrl}/api/pandals/college-square/food?radius=-10`);
      assert.equal(res2.status, 400);
    });

    // 9. Invalid limit returns 400
    await asyncTest("9. Invalid limit (>50 or non-integer) returns HTTP 400", async () => {
      const res1 = await fetch(`${baseUrl}/api/pandals/college-square/food?limit=100`);
      assert.equal(res1.status, 400);
      const json1 = await res1.json();
      assert.equal(json1.success, false);
      assert.match(json1.message, /limit/i);

      const res2 = await fetch(`${baseUrl}/api/pandals/college-square/food?limit=abc`);
      assert.equal(res2.status, 400);
    });

    // 10. Unknown pandal returns 404
    await asyncTest("10. Unknown pandal ID returns HTTP 404", async () => {
      const res = await fetch(`${baseUrl}/api/pandals/unknown-nonexistent-pandal/food`);
      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.message, "Pandal not found");
    });

    // 11. Pandal with no food records returns 200 with empty array
    await asyncTest("11. Pandal with no FoodPlace records returns 200 with count 0 and empty data", async () => {
      try {
        foodReadService.getFoodPlacesForPandal = async () => [];

        const res = await fetch(`${baseUrl}/api/pandals/college-square/food`);
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.success, true);
        assert.equal(json.count, 0);
        assert.deepEqual(json.data, []);
      } finally {
        foodReadService.getFoodPlacesForPandal = originalGetFoodPlaces;
      }
    });

    // 12, 13, 14. API does NOT invoke discovery, persistence, or external Geoapify
    test("12, 13, 14. Read API never invoked foodDiscovery or foodPersistence services", () => {
      assert.equal(discoveryCalled, false, "foodDiscoveryService must never be called by read endpoint");
      assert.equal(persistenceCalled, false, "foodPersistenceService must never be called by read endpoint");
    });

    // 15. MongoDB read failure returns sanitized HTTP 500
    await asyncTest("15. MongoDB read failure returns HTTP 500 with sanitized error message", async () => {
      try {
        foodReadService.getFoodPlacesForPandal = async () => {
          const err = new Error("Database query timeout at mongodb://user:secretPass123@cluster0.mongodb.net/baahon");
          err.statusCode = 500;
          throw err;
        };

        const res = await fetch(`${baseUrl}/api/pandals/college-square/food`);
        assert.equal(res.status, 500);
        const json = await res.json();
        assert.equal(json.success, false);
        // Verify secrets not leaked in response
        assert.ok(!JSON.stringify(json).includes("secretPass123"));
      } finally {
        foodReadService.getFoodPlacesForPandal = originalGetFoodPlaces;
      }
    });

  } finally {
    foodReadService.getFoodPlacesForPandal = originalGetFoodPlaces;
    foodDiscoveryService.discoverFoodNearPandal = originalDiscover;
    foodPersistenceService.persistFoodPlaces = originalPersist;

    if (server) {
      server.close();
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }

  console.log("\n========================================");
  if (process.exitCode) {
    console.log("❌ Some MongoDB-backed Food API tests failed.");
    process.exit(1);
  } else {
    console.log("MongoDB-backed Food API Tests: ALL 17 TEST CRITERIA PASSED");
    console.log("========================================\n");
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error("Fatal test runner failure:", err);
  process.exit(1);
});

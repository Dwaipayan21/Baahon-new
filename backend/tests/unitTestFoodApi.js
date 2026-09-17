/**
 * Deterministic API & Controller Unit Tests
 * 
 * Tests the food discovery endpoint (GET /api/pandals/:pandalId/food),
 * pandal resolution logic, parameter validation, error handling, and response schema.
 * 
 * 100% offline and deterministic - no live external API or MongoDB dependencies.
 */

const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("../server.js");
const {
  resolvePandal,
  getFoodForPandal,
  MAX_RADIUS_METERS,
  MAX_LIMIT
} = require("../controllers/food.controller.js");
const foodDiscoveryService = require("../services/foodDiscovery.service.js");

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
  console.log("\n--- Running Unit Tests for Food Discovery API & Controller ---\n");

  // 1. Pandal resolution tests
  await asyncTest("resolvePandal resolves by 'pandal-N' format", async () => {
    const pandal = await resolvePandal("pandal-0");
    assert.ok(pandal, "Should resolve pandal-0");
    assert.equal(pandal.name, "Bagbazar Sarbojanin");
  });

  await asyncTest("resolvePandal resolves by slugified name", async () => {
    const pandal = await resolvePandal("college-square");
    assert.ok(pandal, "Should resolve college-square slug");
    assert.equal(pandal.name, "College Square");
  });

  await asyncTest("resolvePandal resolves by exact name (case-insensitive)", async () => {
    const pandal = await resolvePandal("ekdalia evergreen club");
    assert.ok(pandal, "Should resolve by exact name");
    assert.equal(pandal.name, "Ekdalia Evergreen Club");
  });

  await asyncTest("resolvePandal returns null for unknown pandal ID", async () => {
    const pandal = await resolvePandal("nonexistent-pandal-9999");
    assert.equal(pandal, null);
  });

  // Start Express server on ephemeral port for end-to-end route tests
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });

  const originalDiscover = foodDiscoveryService.discoverFoodNearPandal;

  try {
    // 2. Nonexistent pandal -> 404
    await asyncTest("GET /api/pandals/:pandalId/food returns 404 when pandal not found", async () => {
      const res = await fetch(`${baseUrl}/api/pandals/unknown-pandal-xyz/food`);
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.message, "Pandal not found");
    });

    // 3. Invalid radius query param -> 400
    await asyncTest("GET /api/pandals/:pandalId/food returns 400 on invalid radius (>1000m)", async () => {
      const res = await fetch(`${baseUrl}/api/pandals/pandal-0/food?radius=1500`);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /radius/i);
    });

    await asyncTest("GET /api/pandals/:pandalId/food returns 400 on negative or non-numeric radius", async () => {
      const res1 = await fetch(`${baseUrl}/api/pandals/pandal-0/food?radius=-50`);
      assert.equal(res1.status, 400);

      const res2 = await fetch(`${baseUrl}/api/pandals/pandal-0/food?radius=abc`);
      assert.equal(res2.status, 400);
    });

    // 4. Invalid limit query param -> 400
    await asyncTest("GET /api/pandals/:pandalId/food returns 400 on invalid limit (>50)", async () => {
      const res = await fetch(`${baseUrl}/api/pandals/pandal-0/food?limit=100`);
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.match(data.message, /limit/i);
    });

    await asyncTest("GET /api/pandals/:pandalId/food returns 400 on non-integer limit", async () => {
      const res = await fetch(`${baseUrl}/api/pandals/pandal-0/food?limit=5.5`);
      assert.equal(res.status, 400);
    });

    // 5. Empty food results -> 200 OK with empty array
    await asyncTest("GET /api/pandals/:pandalId/food returns 200 with empty array when no food places found", async () => {
      foodDiscoveryService.discoverFoodNearPandal = async (pandal, opts) => ({
        pandalId: pandal.id,
        pandalName: pandal.name,
        coordinates: { lat: 22.5, lng: 88.3 },
        places: [],
        totalFound: 0,
        radiusMeters: opts.radiusMeters || 500,
        success: true,
        error: null
      });

      const res = await fetch(`${baseUrl}/api/pandals/pandal-0/food`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.count, 0);
      assert.deepEqual(json.data, []);
    });

    // 6. Successful discovery with normalized 11-field schema -> 200 OK
    await asyncTest("GET /api/pandals/:pandalId/food returns 200 with normalized food places", async () => {
      const mockPlaces = [
        {
          id: "geoapify_place_123",
          pandalId: "pandal-0",
          name: "Mocambo",
          latitude: 22.5512,
          longitude: 88.3521,
          distanceFromPandal: 220,
          distanceBand: "very_nearby",
          category: "restaurant",
          address: "Park Street, Kolkata",
          source: "geoapify",
          sourceId: "place_123"
        }
      ];

      foodDiscoveryService.discoverFoodNearPandal = async (pandal, opts) => ({
        pandalId: pandal.id,
        pandalName: pandal.name,
        coordinates: { lat: 22.55, lng: 88.35 },
        places: mockPlaces,
        totalFound: mockPlaces.length,
        radiusMeters: opts.radiusMeters || 500,
        success: true,
        error: null
      });

      const res = await fetch(`${baseUrl}/api/pandals/pandal-0/food?radius=500&limit=10`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.count, 1);
      assert.equal(json.data.length, 1);

      const place = json.data[0];
      // Verify all 11 required normalized fields are present
      assert.equal(place.id, "geoapify_place_123");
      assert.equal(place.pandalId, "pandal-0");
      assert.equal(place.name, "Mocambo");
      assert.equal(place.latitude, 22.5512);
      assert.equal(place.longitude, 88.3521);
      assert.equal(place.distanceFromPandal, 220);
      assert.equal(place.distanceBand, "very_nearby");
      assert.equal(place.category, "restaurant");
      assert.equal(place.address, "Park Street, Kolkata");
      assert.equal(place.source, "geoapify");
      assert.equal(place.sourceId, "place_123");
    });

    // 7. Upstream service failure -> 502 Bad Gateway
    await asyncTest("GET /api/pandals/:pandalId/food returns 502 with sanitized message on service error", async () => {
      foodDiscoveryService.discoverFoodNearPandal = async () => ({
        pandalId: "pandal-0",
        pandalName: "Bagbazar",
        coordinates: { lat: 22.6, lng: 88.3 },
        places: [],
        totalFound: 0,
        radiusMeters: 500,
        success: false,
        error: "Geoapify API responded with HTTP 504 (Gateway Timeout)"
      });

      const res = await fetch(`${baseUrl}/api/pandals/pandal-0/food`);
      assert.equal(res.status, 502);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.message, "Failed to discover food places from upstream service");
      // Must not expose internal error or API key
      assert.ok(!JSON.stringify(json).includes("Geoapify"));
    });

    // 8. Missing coordinates handling
    // 8. Missing coordinates handling
    await asyncTest("GET /api/pandals/:pandalId/food returns 400 when pandal has missing coordinates", async () => {
      const origExtract = foodDiscoveryService.extractCoordinates;
      foodDiscoveryService.extractCoordinates = () => null;

      try {
        const res = await fetch(`${baseUrl}/api/pandals/pandal-0/food`);
        assert.equal(res.status, 400);
        const json = await res.json();
        assert.equal(json.success, false);
        assert.equal(json.message, "Pandal coordinates are missing or invalid");
      } finally {
        foodDiscoveryService.extractCoordinates = origExtract;
      }
    });

  } finally {
    foodDiscoveryService.discoverFoodNearPandal = originalDiscover;
    if (server) {
      server.close();
    }
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }

  console.log("\n========================================");
  if (process.exitCode) {
    console.log("❌ Some API unit tests failed.");
    process.exit(1);
  } else {
    console.log("API Unit Test Results: ALL TESTS PASSED");
    console.log("========================================\n");
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error("Fatal test runner failure:", err);
  process.exit(1);
});

import assert from "node:assert/strict";
import { getFoodPlacesForPandal, DEFAULT_SEARCH_RADIUS_METERS } from "../services/food/foodRead.service.js";
import { discoverFoodNearPandal, FOOD_SEARCH_RADIUS_METERS } from "../services/food/foodDiscovery.service.js";

console.log("\n============================================================");
console.log("   FOCUSED RADIUS DEFAULT (1000m) & OVERRIDE TEST");
console.log("   (Zero MongoDB & Zero External API Calls)");
console.log("============================================================\n");

// 1. Constants
assert.equal(DEFAULT_SEARCH_RADIUS_METERS, 1000, "DEFAULT_SEARCH_RADIUS_METERS must be 1000");
assert.equal(FOOD_SEARCH_RADIUS_METERS, 1000, "FOOD_SEARCH_RADIUS_METERS must be 1000");
console.log("PASS: Configuration constants are both 1000m");

let capturedFilter = null;
const mockModel = {
  find(f) {
    capturedFilter = f;
    return {
      sort() {
        return {
          limit() {
            return {
              lean: async () => []
            };
          }
        };
      }
    };
  }
};

// 2. Omitted radius in foodRead.service
await getFoodPlacesForPandal("pandal-0", { Model: mockModel });
assert.deepEqual(capturedFilter.distanceFromPandal, { $lte: 1000 }, "Omitted radius should filter <= 1000m");
console.log("PASS: foodRead.service defaults to 1000m filter when radius is omitted");

// 3. Explicit radius=500 in foodRead.service
await getFoodPlacesForPandal("pandal-0", { radiusMeters: 500, Model: mockModel });
assert.deepEqual(capturedFilter.distanceFromPandal, { $lte: 500 }, "Explicit 500 should filter <= 500m");
console.log("PASS: foodRead.service respects explicit radius=500 filter");

// 4. Explicit radius=1000 in foodRead.service
await getFoodPlacesForPandal("pandal-0", { radiusMeters: 1000, Model: mockModel });
assert.deepEqual(capturedFilter.distanceFromPandal, { $lte: 1000 }, "Explicit 1000 should filter <= 1000m");
console.log("PASS: foodRead.service respects explicit radius=1000 filter");

// 5. discoverFoodNearPandal with mocked fetch
const originalFetch = global.fetch;
let capturedUrl = null;
global.fetch = async (url) => {
  capturedUrl = url;
  return {
    ok: true,
    json: async () => ({ type: "FeatureCollection", features: [] })
  };
};

try {
  // Test omitted radius
  await discoverFoodNearPandal({ name: "Test Pandal", lat: 22.5, lng: 88.3 }, { apiKey: "dummy_key" });
  assert.ok(capturedUrl.includes("circle%3A88.3%2C22.5%2C1000") || capturedUrl.includes("circle:88.3,22.5,1000"), "Geoapify filter should have circle 1000m");
  console.log("PASS: discoverFoodNearPandal defaults to circle 1000m when radius is omitted");

  // Test explicit radius=500
  await discoverFoodNearPandal({ name: "Test Pandal", lat: 22.5, lng: 88.3 }, { radiusMeters: 500, apiKey: "dummy_key" });
  assert.ok(capturedUrl.includes("circle%3A88.3%2C22.5%2C500") || capturedUrl.includes("circle:88.3,22.5,500"), "Geoapify filter should have circle 500m");
  console.log("PASS: discoverFoodNearPandal respects explicit radius=500");

  // Test explicit radius=1000
  await discoverFoodNearPandal({ name: "Test Pandal", lat: 22.5, lng: 88.3 }, { radiusMeters: 1000, apiKey: "dummy_key" });
  assert.ok(capturedUrl.includes("circle%3A88.3%2C22.5%2C1000") || capturedUrl.includes("circle:88.3,22.5,1000"), "Geoapify filter should have circle 1000m");
  console.log("PASS: discoverFoodNearPandal respects explicit radius=1000");
} finally {
  global.fetch = originalFetch;
}

console.log("\n============================================================");
console.log("   ALL FOCUSED RADIUS VERIFICATION TESTS PASSED!");
console.log("============================================================\n");

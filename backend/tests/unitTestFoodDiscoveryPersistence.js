/**
 * Unit Tests for Food Discovery + Persistence Workflow (Phase 2C-3)
 * 
 * Deterministic tests verifying orchestration, failure-safety, sequential execution,
 * parameter passthrough, and isolation.
 * 
 * Zero live network, Geoapify, or database dependencies.
 */

const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const {
  discoverAndPersistFoodForPandal,
  discoverAndPersistFoodForPandals
} = require("../services/foodDiscoveryPersistence.service.js");
const app = require("../server.js");

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
  console.log("\n--- Running Unit Tests for Food Discovery + Persistence Workflow ---\n");

  const samplePandalId = new mongoose.Types.ObjectId().toString();
  const samplePandal = {
    _id: samplePandalId,
    name: "College Square",
    location: { type: "Point", coordinates: [88.3635, 22.573] }
  };

  const sampleDiscoveredPlaces = [
    {
      id: "geo_1",
      pandalId: samplePandalId,
      name: "Paramount Juices",
      latitude: 22.5735,
      longitude: 88.3639,
      distanceFromPandal: 158,
      distanceBand: "very_nearby",
      category: "cafe",
      address: "Bankim Chatterjee St",
      source: "geoapify",
      sourceId: "place_101"
    }
  ];

  // 1. Single pandal successful workflow
  await asyncTest("1. Single pandal successful workflow orchestrates discovery and persistence", async () => {
    let discoveryCalled = 0;
    let persistenceReceivedPlaces = null;

    const mockDiscovery = {
      discoverFoodNearPandal: async (pandal, opts) => {
        discoveryCalled++;
        return {
          success: true,
          places: sampleDiscoveredPlaces
        };
      }
    };

    const mockPersistence = {
      persistFoodPlaces: async (places, opts) => {
        persistenceReceivedPlaces = places;
        return {
          total: 1,
          created: 1,
          updated: 0,
          failed: 0,
          data: places,
          errors: []
        };
      }
    };

    const result = await discoverAndPersistFoodForPandal(samplePandal, {
      discoveryService: mockDiscovery,
      persistenceService: mockPersistence
    });

    assert.equal(discoveryCalled, 1);
    assert.deepEqual(persistenceReceivedPlaces, sampleDiscoveredPlaces);
    assert.equal(result.pandalId, samplePandalId);
    assert.equal(result.pandalName, "College Square");
    assert.equal(result.discovered, 1);
    assert.equal(result.persisted.created, 1);
    assert.equal(result.persisted.updated, 0);
  });

  // 2. Empty discovery result
  await asyncTest("2. Empty discovery result does not invoke persistence and reports 0", async () => {
    let persistenceCalled = false;

    const mockDiscovery = {
      discoverFoodNearPandal: async () => ({
        success: true,
        places: []
      })
    };

    const mockPersistence = {
      persistFoodPlaces: async () => {
        persistenceCalled = true;
        return { total: 0, created: 0, updated: 0, failed: 0, data: [], errors: [] };
      }
    };

    const result = await discoverAndPersistFoodForPandal(samplePandal, {
      discoveryService: mockDiscovery,
      persistenceService: mockPersistence
    });

    assert.equal(persistenceCalled, false, "Persistence must not be called on empty discovery");
    assert.equal(result.discovered, 0);
    assert.equal(result.persisted.total, 0);
    assert.equal(result.persisted.created, 0);
  });

  // 3. Discovery failure
  await asyncTest("3. Discovery failure propagates error and halts persistence", async () => {
    let persistenceCalled = false;

    const mockDiscovery = {
      discoverFoodNearPandal: async () => ({
        success: false,
        error: "Geoapify API timed out with HTTP 504"
      })
    };

    const mockPersistence = {
      persistFoodPlaces: async () => {
        persistenceCalled = true;
      }
    };

    try {
      await discoverAndPersistFoodForPandal(samplePandal, {
        discoveryService: mockDiscovery,
        persistenceService: mockPersistence
      });
      assert.fail("Should have thrown on discovery failure");
    } catch (err) {
      assert.equal(err.name, "FoodDiscoveryError");
      assert.match(err.message, /Geoapify API timed out/);
      assert.equal(persistenceCalled, false, "Persistence must never be called when discovery fails");
    }
  });

  // 4. Persistence failure
  await asyncTest("4. Persistence failure after successful discovery surfaces properly", async () => {
    const mockDiscovery = {
      discoverFoodNearPandal: async () => ({
        success: true,
        places: sampleDiscoveredPlaces
      })
    };

    const mockPersistence = {
      persistFoodPlaces: async () => {
        throw new Error("Database connection dropped");
      }
    };

    try {
      await discoverAndPersistFoodForPandal(samplePandal, {
        discoveryService: mockDiscovery,
        persistenceService: mockPersistence
      });
      assert.fail("Should have thrown on persistence failure");
    } catch (err) {
      assert.equal(err.name, "FoodPersistenceError");
      assert.match(err.message, /Database connection dropped/);
    }
  });

  // 5. Batch with all successful pandals
  await asyncTest("5. Batch workflow succeeds for all pandals and computes totals", async () => {
    const pandal2Id = new mongoose.Types.ObjectId().toString();
    const batchPandals = [
      samplePandal,
      { _id: pandal2Id, name: "Ekdalia Evergreen", location: { type: "Point", coordinates: [88.365, 22.518] } }
    ];

    const mockDiscovery = {
      discoverFoodNearPandal: async (p) => ({
        success: true,
        places: sampleDiscoveredPlaces
      })
    };

    const mockPersistence = {
      persistFoodPlaces: async () => ({
        total: 1,
        created: 1,
        updated: 0,
        failed: 0,
        data: sampleDiscoveredPlaces,
        errors: []
      })
    };

    const summary = await discoverAndPersistFoodForPandals(batchPandals, {
      discoveryService: mockDiscovery,
      persistenceService: mockPersistence
    });

    assert.equal(summary.totalPandals, 2);
    assert.equal(summary.successfulPandals, 2);
    assert.equal(summary.failedPandals, 0);
    assert.equal(summary.totalDiscovered, 2);
    assert.equal(summary.totalCreated, 2);
    assert.equal(summary.results.length, 2);
    assert.equal(summary.errors.length, 0);
  });

  // 6. Batch with one failed pandal
  await asyncTest("6. Batch continues processing remaining pandals when one fails", async () => {
    const pandal2Id = new mongoose.Types.ObjectId().toString();
    const batchPandals = [
      { _id: "failing-pandal", name: "Failing Pandal", location: null },
      { _id: pandal2Id, name: "Successful Pandal", location: { type: "Point", coordinates: [88.365, 22.518] } }
    ];

    let callIndex = 0;
    const mockDiscovery = {
      discoverFoodNearPandal: async (p) => {
        callIndex++;
        if (callIndex === 1) {
          return { success: false, error: "Missing coordinates" };
        }
        return { success: true, places: sampleDiscoveredPlaces };
      }
    };

    const mockPersistence = {
      persistFoodPlaces: async () => ({
        total: 1,
        created: 0,
        updated: 1,
        failed: 0,
        data: sampleDiscoveredPlaces,
        errors: []
      })
    };

    const summary = await discoverAndPersistFoodForPandals(batchPandals, {
      discoveryService: mockDiscovery,
      persistenceService: mockPersistence
    });

    assert.equal(summary.totalPandals, 2);
    assert.equal(summary.successfulPandals, 1);
    assert.equal(summary.failedPandals, 1);
    assert.equal(summary.totalDiscovered, 1);
    assert.equal(summary.totalCreated, 0);
    assert.equal(summary.totalUpdated, 1);
    assert.equal(summary.results.length, 1);
    assert.equal(summary.errors.length, 1);
    assert.equal(summary.errors[0].pandalName, "Failing Pandal");
  });

  // 7. Sequential/safe processing verification
  await asyncTest("7. Batch processes pandals strictly sequentially without uncontrolled concurrency", async () => {
    let concurrentCalls = 0;
    let maxConcurrentObserved = 0;

    const batch = [
      { _id: new mongoose.Types.ObjectId().toString(), name: "Pandal A" },
      { _id: new mongoose.Types.ObjectId().toString(), name: "Pandal B" },
      { _id: new mongoose.Types.ObjectId().toString(), name: "Pandal C" }
    ];

    const mockDiscovery = {
      discoverFoodNearPandal: async () => {
        concurrentCalls++;
        if (concurrentCalls > maxConcurrentObserved) {
          maxConcurrentObserved = concurrentCalls;
        }
        await new Promise((r) => setTimeout(r, 20));
        concurrentCalls--;
        return { success: true, places: [] };
      }
    };

    await discoverAndPersistFoodForPandals(batch, { discoveryService: mockDiscovery });
    assert.equal(maxConcurrentObserved, 1, "Concurrency must be strictly 1 (sequential)");
  });

  // 8. Options passthrough
  await asyncTest("8. Options (radiusMeters, limit) are passed through to discovery unmodified", async () => {
    let capturedOptions = null;

    const mockDiscovery = {
      discoverFoodNearPandal: async (pandal, opts) => {
        capturedOptions = opts;
        return { success: true, places: [] };
      }
    };

    await discoverAndPersistFoodForPandal(samplePandal, {
      discoveryService: mockDiscovery,
      radiusMeters: 750,
      limit: 15
    });

    assert.equal(capturedOptions.radiusMeters, 750);
    assert.equal(capturedOptions.limit, 15);
  });

  // 9. API route behavior is unaffected
  await asyncTest("9. Existing food API route continues behaving unchanged without auto-persisting", async () => {
    let server;
    try {
      server = await new Promise((resolve) => {
        const s = app.listen(0, "127.0.0.1", () => resolve(s));
      });
      const port = server.address().port;
      const res = await fetch(`http://127.0.0.1:${port}/api/pandals/unknown-pandal-test/food`);
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.message, "Pandal not found");
    } finally {
      if (server) server.close();
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
    }
  });

  console.log("\n========================================");
  if (process.exitCode) {
    console.log("❌ Some Discovery-Persistence workflow tests failed.");
    process.exit(1);
  } else {
    console.log("Discovery-Persistence Workflow Unit Tests: ALL 9 TESTS PASSED");
    console.log("========================================\n");
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error("Fatal test runner failure:", err);
  process.exit(1);
});

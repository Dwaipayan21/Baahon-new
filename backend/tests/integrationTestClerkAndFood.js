import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import app from "../server.js";
import CheckIn from "../models/checkin.model.js";
import Pandal from "../models/pandal.model.js";
import FoodPlace from "../models/foodPlace.model.js";
import rawPandals from "../data/pandals.json" with { type: "json" };

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
  }
}

async function asyncTest(name, fn) {
  total++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
  }
}

async function runAll() {
  console.log("\n========================================================");
  console.log("       CLERK & FOOD ENGINE INTEGRATION TESTS");
  console.log("========================================================\n");

  let server;
  let baseUrl;

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  try {
    // ----------------------------------------------------
    // CLERK TEST 3: Unauthenticated POST /api/checkins -> 401
    // ----------------------------------------------------
    await asyncTest("CLERK TEST 3: Unauthenticated POST /api/checkins returns 401 with 'Authentication required'", async () => {
      const res = await fetch(`${baseUrl}/api/checkins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pandalId: "650000000000000000000001",
          latitude: 22.5744,
          longitude: 88.3639,
        }),
      });

      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.message, "Authentication required");
    });

    // ----------------------------------------------------
    // CLERK TEST 7: Public check-in count works without auth
    // ----------------------------------------------------
    await asyncTest("CLERK TEST 7: GET /api/checkins/pandal/:pandalId/count works publicly without auth", async () => {
      // Find or seed a pandal for counting
      let pandal = await Pandal.findOne();
      if (!pandal && rawPandals.length > 0) {
        const raw = rawPandals[0];
        pandal = await Pandal.create({
          name: raw.name,
          category: raw.category || "traditional",
          location: {
            type: "Point",
            coordinates: [raw["location/coordinates/0"] || 88.3639, raw["location/coordinates/1"] || 22.5726]
          }
        });
      }

      if (pandal) {
        const res = await fetch(`${baseUrl}/api/checkins/pandal/${pandal._id}/count`);
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.success, true);
        assert.equal(json.data.pandalId, String(pandal._id));
        assert.equal(typeof json.data.visitorCount, "number");
      } else {
        // Test invalid pandal ID returns 400
        const res = await fetch(`${baseUrl}/api/checkins/pandal/invalid-id/count`);
        assert.equal(res.status, 400);
      }
    });

    // ----------------------------------------------------
    // CLERK TEST 4 & 5 & 6: Authenticated Check-In Logic & Duplicate Protection
    // ----------------------------------------------------
    await asyncTest("CLERK TESTS 4, 5, 6: Check-in business logic, duplicate protection, and multi-user isolation", async () => {
      let pandal = await Pandal.findOne();
      if (!pandal && rawPandals.length > 0) {
        const raw = rawPandals[0];
        pandal = await Pandal.create({
          name: raw.name,
          category: raw.category || "traditional",
          location: {
            type: "Point",
            coordinates: [raw["location/coordinates/0"] || 88.3639, raw["location/coordinates/1"] || 22.5726]
          }
        });
      }

      if (pandal) {
        const coords = pandal.location.coordinates;
        const lng = coords[0];
        const lat = coords[1];

        // Clean up test check-ins if any
        await CheckIn.deleteMany({
          userId: { $in: ["user_test_clerk_user_1", "user_test_clerk_user_2"] },
          pandalId: pandal._id,
        });

        // 4. Authenticated user 1 check-in (simulating auth middleware req.userId)
        const checkIn1 = await CheckIn.create({
          userId: "user_test_clerk_user_1",
          pandalId: pandal._id,
          location: { type: "Point", coordinates: [lng, lat] },
          category: pandal.category || "traditional",
          points: 100,
        });
        assert.ok(checkIn1._id);
        assert.equal(checkIn1.userId, "user_test_clerk_user_1");

        // 5. Duplicate Check-in: same user + same pandal triggers duplicate error (11000)
        let dupFailed = false;
        try {
          await CheckIn.create({
            userId: "user_test_clerk_user_1",
            pandalId: pandal._id,
            location: { type: "Point", coordinates: [lng, lat] },
            category: pandal.category || "traditional",
            points: 100,
          });
        } catch (err) {
          dupFailed = true;
          assert.equal(err.code, 11000);
        }
        assert.equal(dupFailed, true, "Duplicate check-in by same user must be rejected by unique index");

        // 6. Different user can check in to the same pandal
        const checkIn2 = await CheckIn.create({
          userId: "user_test_clerk_user_2",
          pandalId: pandal._id,
          location: { type: "Point", coordinates: [lng, lat] },
          category: pandal.category || "traditional",
          points: 100,
        });
        assert.ok(checkIn2._id);
        assert.equal(checkIn2.userId, "user_test_clerk_user_2");

        // Clean up
        await CheckIn.deleteMany({
          userId: { $in: ["user_test_clerk_user_1", "user_test_clerk_user_2"] },
          pandalId: pandal._id,
        });
      }
    });

    // ----------------------------------------------------
    // FOOD ENGINE TESTS: GET /api/pandals/:pandalId/food
    // ----------------------------------------------------
    await asyncTest("FOOD ENGINE: GET /api/pandals/:pandalId/food returns valid food response", async () => {
      const res = await fetch(`${baseUrl}/api/pandals/college-square/food`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.pandalId);
      assert.equal(typeof json.count, "number");
      assert.ok(Array.isArray(json.data));
    });

    await asyncTest("FOOD ENGINE: Category filtering query works", async () => {
      const res = await fetch(`${baseUrl}/api/pandals/college-square/food?category=cafe`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.data));
      // Any returned results must match category
      json.data.forEach((item) => {
        assert.equal(item.category.toLowerCase(), "cafe");
      });
    });

    await asyncTest("FOOD ENGINE: Radius filtering query works", async () => {
      const res = await fetch(`${baseUrl}/api/pandals/college-square/food?radius=300`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.data));
      json.data.forEach((item) => {
        assert.ok(item.distanceFromPandal <= 300);
      });
    });

    await asyncTest("FOOD ENGINE: Invalid parameters return 400 with helpful message", async () => {
      const res1 = await fetch(`${baseUrl}/api/pandals/college-square/food?radius=2000`);
      assert.equal(res1.status, 400);

      const res2 = await fetch(`${baseUrl}/api/pandals/college-square/food?limit=-1`);
      assert.equal(res2.status, 400);
    });

    await asyncTest("FOOD ENGINE: Unknown pandal returns 404", async () => {
      const res = await fetch(`${baseUrl}/api/pandals/nonexistent-pandal-id-12345/food`);
      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.message, "Pandal not found");
    });

  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }

  console.log("\n========================================================");
  console.log(`Results: ${passed}/${total} tests passed`);
  console.log("========================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error("Integration test fatal failure:", err);
  process.exit(1);
});

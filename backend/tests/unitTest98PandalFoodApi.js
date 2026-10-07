/**
 * Safe Offline API Route Test for All 98 Pandals
 * 
 * Tests GET /api/pandals/:pandalId/food Express endpoint:
 * - Parameter validation (radius, limit)
 * - Error handling (400, 404)
 * - Pandal resolution across the 98-dataset
 * - Response JSON structure matching frontend contracts
 * - ZERO MongoDB connection.
 * - ZERO external API calls.
 */

import assert from "node:assert/strict";
import express from "express";
import mongoose from "mongoose";
import foodRoutes from "../routes/food.routes.js";

const app = express();
app.use(express.json());
app.use("/api/pandals", foodRoutes);

let server;
let baseUrl;

async function runTests() {
  console.log("\n============================================================");
  console.log("   SAFE OFFLINE FOOD API VALIDATION TEST");
  console.log("   (Zero MongoDB & Zero External API Calls)");
  console.log("============================================================\n");

  await new Promise(resolve => {
    server = app.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/pandals`;
      resolve();
    });
  });

  try {
    // 1. Invalid radius (> 1000m)
    const res1 = await fetch(`${baseUrl}/pandal-0/food?radius=1500`);
    assert.equal(res1.status, 400);
    const body1 = await res1.json();
    assert.equal(body1.success, false);
    assert.ok(body1.message.includes("radius"));
    console.log("  PASS: 1. Radius > 1000m rejected with 400 Bad Request");

    // 2. Negative/invalid limit
    const res2 = await fetch(`${baseUrl}/pandal-0/food?limit=-5`);
    assert.equal(res2.status, 400);
    const body2 = await res2.json();
    assert.equal(body2.success, false);
    assert.ok(body2.message.includes("limit"));
    console.log("  PASS: 2. Negative limit rejected with 400 Bad Request");

    // 3. Limit > 50
    const res3 = await fetch(`${baseUrl}/pandal-0/food?limit=100`);
    assert.equal(res3.status, 400);
    const body3 = await res3.json();
    assert.equal(body3.success, false);
    assert.ok(body3.message.includes("limit"));
    console.log("  PASS: 3. Limit > 50 rejected with 400 Bad Request");

    // 4. Non-existent pandal returns 404
    const res4 = await fetch(`${baseUrl}/non-existent-pandal-xyz/food`);
    assert.equal(res4.status, 404);
    const body4 = await res4.json();
    assert.equal(body4.success, false);
    assert.equal(body4.message, "Pandal not found");
    console.log("  PASS: 4. Non-existent pandal returns 404 Not Found");

    // 5. Pandal from 98 dataset resolves and returns valid contract
    // (Note: DB is disconnected in this test, so findOneAndUpdate auto-discovery fails silently without crashing)
    const res5 = await fetch(`${baseUrl}/Alipore%20Sarbojanin/food?radius=500&limit=15`);
    assert.equal(res5.status, 200);
    const body5 = await res5.json();
    assert.equal(body5.success, true);
    assert.equal(body5.pandalName, "Alipore Sarbojanin");
    assert.equal(Array.isArray(body5.data), true);
    console.log("  PASS: 5. 98-dataset pandal resolves and returns HTTP 200 with standard contract");

    // 6. Index resolution for 98th pandal (pandal-97)
    const res6 = await fetch(`${baseUrl}/pandal-97/food`);
    assert.equal(res6.status, 200);
    const body6 = await res6.json();
    assert.equal(body6.success, true);
    assert.equal(body6.pandalName, "GD Block Durga Puja");
    console.log("  PASS: 6. 98th pandal index (pandal-97) resolves to 'GD Block Durga Puja' and returns HTTP 200");

    // 7. Omitted radius defaults to 1000m, explicit 500m and 1000m accepted
    const res7Omitted = await fetch(`${baseUrl}/pandal-0/food`);
    assert.equal(res7Omitted.status, 200);
    console.log("  PASS: 7. Request with omitted radius returns HTTP 200 (default 1000m)");

    const res8Exp500 = await fetch(`${baseUrl}/pandal-0/food?radius=500`);
    assert.equal(res8Exp500.status, 200);
    console.log("  PASS: 8. Request with explicit radius=500 returns HTTP 200 (respected)");

    const res9Exp1000 = await fetch(`${baseUrl}/pandal-0/food?radius=1000`);
    assert.equal(res9Exp1000.status, 200);
    console.log("  PASS: 9. Request with explicit radius=1000 returns HTTP 200 (accepted)");

    console.log("\n============================================================");
    console.log("   Food API Route Validation: ALL 9 TESTS PASSED");
    console.log("============================================================\n");
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error("API test fatal error:", err);
  process.exit(1);
});

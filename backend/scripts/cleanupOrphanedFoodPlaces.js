import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

import FoodPlace from "../models/foodPlace.model.js";
import Pandal from "../models/pandal.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, "../reports");
const BACKUP_PATH = path.join(BACKUP_DIR, "orphanedFoodPlaces310Backup.json");

async function executeTargetedCleanup() {
  await mongoose.connect(process.env.MONGO_URI);
  const dbName = mongoose.connection.name;

  try {
    console.log("============================================================");
    console.log("   TARGETED CLEANUP OF ORPHANED FOODPLACE RECORDS");
    console.log("============================================================\n");
    console.log(`Connected to database: "${dbName}"`);

    // STEP 3: Pre-cleanup audit
    const totalFoodPlaces = await FoodPlace.countDocuments();
    const currentPandals = await Pandal.find({}, { _id: 1, name: 1 }).lean();
    const currentPandalIds = currentPandals.map((p) => p._id);
    const currentPandalIdSet = new Set(currentPandals.map((p) => String(p._id)));

    const activeFoodPlacesCount = await FoodPlace.countDocuments({
      pandalId: { $in: currentPandalIds }
    });

    const orphanedFoodPlacesCount = await FoodPlace.countDocuments({
      pandalId: { $nin: currentPandalIds }
    });

    console.log(`Pre-cleanup Counts:`);
    console.log(` - Total FoodPlaces in DB: ${totalFoodPlaces}`);
    console.log(` - Current Pandals in DB: ${currentPandals.length}`);
    console.log(` - Active FoodPlaces (matching current pandals): ${activeFoodPlacesCount}`);
    console.log(` - Orphaned FoodPlaces (non-matching pandals): ${orphanedFoodPlacesCount}`);

    // Verify strict prerequisites
    if (
      totalFoodPlaces !== 1208 ||
      currentPandals.length !== 98 ||
      activeFoodPlacesCount !== 898 ||
      orphanedFoodPlacesCount !== 310
    ) {
      console.error("\n❌ SAFETY CHECK FAILED: Counts do not match expected prerequisites!");
      console.error(`Expected: Total=1208, Pandals=98, Active=898, Orphaned=310`);
      console.error(`Found: Total=${totalFoodPlaces}, Pandals=${currentPandals.length}, Active=${activeFoodPlacesCount}, Orphaned=${orphanedFoodPlacesCount}`);
      process.exit(1);
    }

    console.log("\n✅ STEP 3 Pre-cleanup audit PASSED.");

    // STEP 4 & 5: Identify exact 310 records & secondary validation
    const orphanedDocs = await FoodPlace.find({
      pandalId: { $nin: currentPandalIds }
    }).lean();

    if (orphanedDocs.length !== 310) {
      console.error(`❌ Secondary validation failed: Expected 310 orphaned docs, retrieved ${orphanedDocs.length}`);
      process.exit(1);
    }

    const orphanedPandalIds = new Set(orphanedDocs.map((d) => String(d.pandalId)));
    console.log(`\nSTEP 4 Verification:`);
    console.log(` - Identified exactly ${orphanedDocs.length} orphaned FoodPlace documents`);
    console.log(` - Number of unique orphaned pandalIds: ${orphanedPandalIds.size}`);

    // Verify none of the 898 active records are in this candidate list
    const orphanedDocIdSet = new Set(orphanedDocs.map((d) => String(d._id)));
    const activeDocs = await FoodPlace.find({
      pandalId: { $in: currentPandalIds }
    }, { _id: 1 }).lean();

    let collisionCount = 0;
    activeDocs.forEach((ad) => {
      if (orphanedDocIdSet.has(String(ad._id))) collisionCount++;
    });

    if (collisionCount > 0) {
      console.error(`❌ CRITICAL: Active record collision detected in deletion set! Collision count: ${collisionCount}`);
      process.exit(1);
    }

    console.log(` - Protected active records: ${activeDocs.length} (Collision count: ${collisionCount})`);

    // STEP 6: Backup / Recoverability
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    fs.writeFileSync(BACKUP_PATH, JSON.stringify(orphanedDocs, null, 2), "utf-8");
    console.log(`\n✅ STEP 6 Backup created successfully at: ${BACKUP_PATH}`);
    console.log(`   (Backed up ${orphanedDocs.length} records)`);

    // STEP 7: Delete ONLY the 310 orphans using exact target _ids
    const orphanedIdsToDelete = orphanedDocs.map((d) => d._id);
    console.log(`\nExecuting targeted deletion of exactly ${orphanedIdsToDelete.length} documents...`);

    const deleteResult = await FoodPlace.deleteMany({
      _id: { $in: orphanedIdsToDelete }
    });

    console.log(`Database reported deletedCount: ${deleteResult.deletedCount}`);

    if (deleteResult.deletedCount !== 310) {
      console.error(`❌ CRITICAL ERROR: Expected deletedCount=310, but got ${deleteResult.deletedCount}! STOPPING.`);
      process.exit(1);
    }

    console.log("✅ STEP 7 Targeted deletion of 310 orphans SUCCESSFUL.");

    // STEP 8: Post-cleanup verification
    const postTotalFoodPlaces = await FoodPlace.countDocuments();
    const postCurrentPandals = await Pandal.countDocuments();
    const postActiveCount = await FoodPlace.countDocuments({
      pandalId: { $in: currentPandalIds }
    });
    const postOrphanedCount = await FoodPlace.countDocuments({
      pandalId: { $nin: currentPandalIds }
    });

    const duplicates = await FoodPlace.aggregate([
      { $group: { _id: { source: "$source", sourceId: "$sourceId", pandalId: "$pandalId" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    const invalidPlaces = await FoodPlace.find({
      $or: [
        { pandalId: { $exists: false } },
        { source: { $ne: "geoapify" } },
        { sourceId: { $in: [null, ""] } },
        { latitude: { $not: { $type: "number" } } },
        { longitude: { $not: { $type: "number" } } },
        { distanceFromPandal: { $not: { $type: "number" } } },
        { distanceFromPandal: { $gt: 1050 } },
        { distanceFromPandal: { $lt: 0 } },
        { distanceBand: { $nin: ["very_nearby", "nearby", "further", "beyond_1000m", "unknown"] } },
        { category: { $in: [null, ""] } }
      ]
    }).lean();

    // Check distribution across pandals
    let pandalsWithFood = 0;
    let pandalsWithZero = 0;
    const zeroPandalNames = [];

    for (const p of currentPandals) {
      const c = await FoodPlace.countDocuments({ pandalId: p._id });
      if (c > 0) pandalsWithFood++;
      else {
        pandalsWithZero++;
        zeroPandalNames.push(p.name);
      }
    }

    console.log("\n--- STEP 8 Post-Cleanup Audit ---");
    console.log(` - Post-cleanup Total FoodPlaces: ${postTotalFoodPlaces}`);
    console.log(` - Post-cleanup Current Pandals: ${postCurrentPandals}`);
    console.log(` - Post-cleanup Active FoodPlaces: ${postActiveCount}`);
    console.log(` - Post-cleanup Orphaned FoodPlaces: ${postOrphanedCount}`);
    console.log(` - Duplicate Groups: ${duplicates.length}`);
    console.log(` - Invalid FoodPlace Records: ${invalidPlaces.length}`);
    console.log(` - Pandals with >= 1 FoodPlace: ${pandalsWithFood}`);
    console.log(` - Pandals with 0 FoodPlaces: ${pandalsWithZero}`);

    const expectedZeroNames = [
      "Ahiritola Jubak Brinda",
      "Kumartuli Park",
      "Ahiritola Sarbojanin Durgotsav",
      "Beniatola Sarbojanin Durgotsav",
      "Udayan Sangha Club ",
      "Haridevpur 41 Pally Club",
      "Ajeya Sanghati",
      "Hatkhola Dutta Bari",
      "Madan Mohan Dutta Family Puja"
    ];

    const allZeroMatch = expectedZeroNames.every((ezn) =>
      zeroPandalNames.some((zpn) => zpn.trim() === ezn.trim())
    );

    console.log(` - Expected 9 zero-result pandals match exactly: ${allZeroMatch}`);

    console.log("\n============================================================");
    console.log("   CLEANUP & AUDIT COMPLETED SUCCESSFULLY");
    console.log("============================================================\n");

  } finally {
    await mongoose.connection.close();
  }
}

executeTargetedCleanup().catch((err) => {
  console.error("FATAL ERROR IN CLEANUP:", err);
  process.exit(1);
});

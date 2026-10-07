# Food Discovery 98-Pandal 1000m Dataset Import Guide

## Overview
This package imports the verified 1000-meter Geoapify food discovery dataset into MongoDB.

The dataset source file is:
`backend/reports/foodDiscovery98Results1000m.json`

### Dataset Summary
- **Total Pandals Processed:** 98
- **Total Qualifying Food Places:** 898
- **Pandals with Discovered Places:** 89
- **Zero-Result Pandals:** 9 (clustered along Hooghly riverbank / outer boundaries)
- **Search Radius:** 1000 meters
- **Geoapify API Calls during import:** **0** (pure file-based replay/import)

---

## Architecture & Idempotency Guarantees
1. **Reuses Production Persistence Service:**
   The script directly imports and uses [`persistFoodPlaces`](file:///C:/Users/Swagata/OneDrive/Documents/GitHub/Baahon-new/Baahon-new/backend/services/food/foodPersistence.service.js) from `backend/services/food/foodPersistence.service.js`.
2. **Database Schema & Constraints:**
   Target collection: `FoodPlace` (`models/foodPlace.model.js`).
   Compound unique index: `{ source: 1, sourceId: 1, pandalId: 1 }`.
3. **Idempotent Upsert Behavior:**
   - Uses `findOneAndUpdate` with `{ upsert: true, $set: sanitized }`.
   - Running the script multiple times will safely update existing records without creating duplicates.
4. **Non-Destructive:**
   - **Never** drops collections.
   - **Never** deletes existing `FoodPlace` or `Pandal` records.
   - Only inserts or updates records matching the 98 pandals in this verified dataset.

---

## Prerequisites & Environment Configuration
Ensure your `backend/.env` file contains a valid `MONGO_URI`:
```env
MONGO_URI=your_mongodb_connection_string
```
*(No API keys or live Geoapify credentials are needed for this import).*

---

## How to Run

### Step 1: Safe Dry-Run (Offline Validation Only)
Before writing anything to the database, you can run the safe validation dry-run. This verifies dataset integrity, checks all 898 records, validates field schemas and distance bands, and tests pandal name resolution against the local master sheet without connecting to MongoDB:

```bash
cd backend
node scripts/importFoodDiscovery98ToMongo.js --dry-run
```

### Step 2: Live Database Import
When your MongoDB instance is running and pandals have been seeded, execute the live import:

```bash
cd backend
node scripts/importFoodDiscovery98ToMongo.js
```

---

## Expected Output

```text
============================================================
   FOOD DISCOVERY 98-PANDAL 1000M DATASET IMPORT SCRIPT     
   Mode: LIVE DATABASE IMPORT
============================================================

1. Loaded 1000m Report: 98 pandals listed.
2. Loaded Final Pandal Sheet: 98 pandals.

--- [Step 1/3] Validating Dataset Integrity ---
✅ Pre-validation PASSED:
   - 98 Pandals verified
   - 898 Food Places verified
   - 0 Duplicates detected
   - 100% of places are within 1000m
   - 100% of places adhere to category & distanceBand contracts

--- [Step 2/3] Connecting to MongoDB ---
MongoDB connection established.

--- [Step 3/3] Resolving Pandals & Executing Upserts ---
Found 98 pandal documents in MongoDB.
✅ All 98 pandals successfully resolved to MongoDB _ids.
Executing idempotent upsert of 898 records...

============================================================
   LIVE IMPORT SUMMARY                                      
============================================================
Total Food Places Processed : 898
Newly Created Records       : 898 (or updated if re-run)
Updated Existing Records    : 0
Failed Records              : 0
============================================================
MongoDB connection closed.
```

---

## Error Handling & Failure Scenarios
- **Unresolved Pandals:** If any pandal from the JSON report cannot be found in MongoDB by name, a warning is printed listing the missing pandals, and the script skips places for those pandals while continuing for all resolved ones.
- **Validation Failure:** If any record contains invalid coordinates, missing fields, or distance exceeding 1000m, pre-validation halts execution immediately before connecting to MongoDB.

/**
 * Test Runner: Geoapify Food Discovery (Backend)
 * 
 * Tests live or offline nearby food discovery for pandals from backend/data/pandals.json.
 * 
 * Usage:
 *   node scripts/testFoodDiscovery.js
 *   npm run test:food
 *   npm run test:food -- --all
 * 
 * SECURITY:
 * - Reads GEOAPIFY_API_KEY from backend/.env or process.env.
 * - Masks the API key in all console outputs.
 * - Never commits secrets.
 */

const fs = require('node:fs');
const path = require('node:path');

// Safe dotenv loading with zero-dependency fallback
try {
  require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
} catch {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

const rawPandals = require('../data/pandals.json');
const {
  FOOD_SEARCH_RADIUS_METERS,
  DEFAULT_FOOD_CATEGORIES,
  extractCoordinates,
  discoverFoodForPandals
} = require('../services/foodDiscovery.service.js');

const isAll = process.argv.includes('--all');
const testPandals = isAll ? rawPandals : rawPandals.slice(0, 10);

function maskKey(key) {
  if (!key || key.length < 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

async function run() {
  console.log('='.repeat(75));
  console.log('       BAAHON (BACKEND) - FOOD DISCOVERY TEST RUNNER');
  console.log('='.repeat(75));

  const apiKey = process.env.GEOAPIFY_API_KEY;

  console.log('\nConfiguration:');
  console.log(`- Search Radius : ${FOOD_SEARCH_RADIUS_METERS} meters`);
  console.log(`- Categories    : ${DEFAULT_FOOD_CATEGORIES.join(', ')}`);
  console.log(`- Pandals Count : ${testPandals.length} of ${rawPandals.length} pandals`);
  console.log(`- API Key Status: ${apiKey ? `Configured (${maskKey(apiKey)})` : 'NOT SET in backend/.env'}`);

  if (!apiKey) {
    console.log('\n' + '!'.repeat(75));
    console.log('⚠️  GEOAPIFY_API_KEY is not set in backend/.env.');
    console.log('   To test against the live Geoapify API, set in backend/.env:');
    console.log('     GEOAPIFY_API_KEY=your_api_key_here');
    console.log('   Or run in terminal:');
    console.log('     $env:GEOAPIFY_API_KEY="your_api_key"; npm run test:food');
    console.log('!'.repeat(75));

    console.log('\nRunning offline validation of pandal coordinates...\n');
    testPandals.forEach((p, idx) => {
      const coords = extractCoordinates(p);
      console.log(`  [${String(idx + 1).padStart(2)}] ${p.name.padEnd(30)} -> Lat ${coords.lat.toFixed(4)}, Lng ${coords.lng.toFixed(4)} [OK]`);
    });
    console.log(`\nVerified: All ${testPandals.length} pandals have valid extractable coordinates.`);
    return;
  }

  console.log('\nBeginning discovery for pandals...\n');

  let successCount = 0;
  let errorCount = 0;
  let totalPlaces = 0;

  const results = await discoverFoodForPandals(testPandals, {
    radiusMeters: FOOD_SEARCH_RADIUS_METERS,
    requestDelayMs: 250
  });

  for (let idx = 0; idx < results.length; idx++) {
    const res = results[idx];
    const num = idx + 1;

    console.log('-'.repeat(75));
    console.log(`[${num}/${testPandals.length}] PANDAL: ${res.pandalName} (ID: ${res.pandalId})`);

    if (!res.coordinates) {
      console.log(`  Coordinates : INVALID / MISSING`);
      console.log(`  Status      : ❌ ERROR: ${res.error}`);
      errorCount++;
      continue;
    }

    console.log(`  Coordinates : Lat ${res.coordinates.lat.toFixed(5)}, Lng ${res.coordinates.lng.toFixed(5)}`);

    if (!res.success) {
      console.log(`  Status      : ❌ API ERROR: ${res.error}`);
      errorCount++;
      continue;
    }

    successCount++;
    totalPlaces += res.totalFound;

    console.log(`  Status      : ✅ Success`);
    console.log(`  Food Places : ${res.totalFound} found within ${res.radiusMeters}m`);

    if (res.places.length === 0) {
      console.log(`    (No food establishments found in immediate 500m radius)`);
    } else {
      res.places.forEach((place, pIdx) => {
        const distStr = place.distanceFromPandal != null ? `${place.distanceFromPandal}m` : 'N/A';
        console.log(`    ${String(pIdx + 1).padStart(2)}. [${distStr.padStart(5)}] ${place.name}`);
        console.log(`        Band: ${place.distanceBand} | Category: ${place.category} | Address: ${place.address || 'Address not listed'}`);
      });
    }
  }

  console.log('\n' + '='.repeat(75));
  console.log('                          TEST SUMMARY');
  console.log('='.repeat(75));
  console.log(`Pandals Tested            : ${testPandals.length}`);
  console.log(`Pandals Successful        : ${successCount}`);
  console.log(`Pandals with Errors       : ${errorCount}`);
  console.log(`Total Food Places Found   : ${totalPlaces}`);
  console.log(`Average Places per Pandal : ${successCount > 0 ? (totalPlaces / successCount).toFixed(1) : 0}`);
  console.log('='.repeat(75));
}

run().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

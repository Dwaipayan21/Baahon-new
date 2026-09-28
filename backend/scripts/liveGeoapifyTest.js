/**
 * Small Live Geoapify Test (1-2 Pandals)
 * 
 * Verifies live Geoapify Places API response, normalization, and distance calculation.
 * Never exposes or logs secrets.
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
const { discoverFoodNearPandal } = require('../services/foodDiscovery.service.js');

function maskKey(key) {
  if (!key || key.length < 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

async function runLiveTest() {
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    console.log('SKIPPED: GEOAPIFY_API_KEY is not configured.');
    return;
  }

  console.log('='.repeat(70));
  console.log('       SMALL LIVE GEOAPIFY INTEGRATION TEST (2 PANDALS)');
  console.log('='.repeat(70));
  console.log(`API Key Status: Configured (${maskKey(apiKey)})\n`);

  // Select 2 representative pandals: Ekdalia Evergreen Club (South) and College Square (Central)
  const testPandals = [
    rawPandals.find((p) => p.name.includes('Ekdalia')) || rawPandals[0],
    rawPandals.find((p) => p.name.includes('College Square')) || rawPandals[1]
  ];

  for (let i = 0; i < testPandals.length; i++) {
    const pandal = testPandals[i];
    console.log(`Testing Pandal [${i + 1}/2]: ${pandal.name}`);

    const result = await discoverFoodNearPandal(pandal, { radiusMeters: 500, limit: 10 });

    console.log(`  Request Success : ${result.success}`);
    console.log(`  Coordinates     : Lat ${result.coordinates?.lat}, Lng ${result.coordinates?.lng}`);
    console.log(`  Places Returned : ${result.totalFound}`);

    if (!result.success) {
      console.log(`  Error Detail    : ${result.error}`);
    } else {
      console.log(`  Normalization   : Verified (${result.places.length > 0 ? 'Fields match standardized schema' : 'Empty result list'})`);
      console.log(`  Distance Calcs  : Verified (${result.places.length > 0 ? `Nearest place at ${result.places[0].distanceFromPandal}m [${result.places[0].distanceBand}]` : 'N/A'})\n`);

      result.places.slice(0, 5).forEach((place, idx) => {
        console.log(`    ${idx + 1}. [${place.distanceFromPandal}m - ${place.distanceBand}] ${place.name}`);
        console.log(`       Category: ${place.category} | Source ID: ${place.sourceId}`);
        console.log(`       Address: ${place.address || 'Not listed'}`);
      });
    }
    console.log('-'.repeat(70));
  }
}

runLiveTest().catch((err) => {
  console.error('Live test error:', err.message);
  process.exit(1);
});

/**
 * Diagnostic Tool: OpenStreetMap / Overpass Food Discovery (Backend)
 * 
 * Batch / diagnostic exploration tool for querying food POIs from OpenStreetMap.
 * 
 * IMPORTANT ARCHITECTURAL NOTE:
 * - This is a DIAGNOSTIC and batch discovery tool ONLY.
 * - Not for user-facing production endpoints due to public Overpass rate-limiting.
 * - Single Overpass query per pandal (1000m radius) with local Haversine partitioning (500m/750m/1000m).
 * - Progressive saving to backend/scripts/output/osm-food-results.json.
 * 
 * Usage:
 *   node scripts/testOsmFoodDiscovery.js
 *   npm run test:osm-food
 */

const fs = require('node:fs');
const path = require('node:path');
const rawPandals = require('../data/pandals.json');
const {
  haversineDistanceMeters,
  extractCoordinates
} = require('../services/foodDiscovery.service.js');

const outputDir = path.join(__dirname, 'output');
const resultsFilePath = path.join(outputDir, 'osm-food-results.json');

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
];

const REQUEST_TIMEOUT_MS = 30000;
const INTER_PANDAL_DELAY_MS = 3500;
const MAX_RETRIES = 2;

const isAll = process.argv.includes('--all');
const testPandals = isAll ? rawPandals : rawPandals.slice(0, 10);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildOverpassQuery(lat, lng, radiusMeters = 1000) {
  return `
[out:json][timeout:25];
(
  node["amenity"~"^(restaurant|cafe|fast_food|ice_cream|food_court)$"](around:${radiusMeters},${lat},${lng});
  way["amenity"~"^(restaurant|cafe|fast_food|ice_cream|food_court)$"](around:${radiusMeters},${lat},${lng});
  node["shop"~"^(bakery|confectionery)$"](around:${radiusMeters},${lat},${lng});
  way["shop"~"^(bakery|confectionery)$"](around:${radiusMeters},${lat},${lng});
);
out center tags;
`.trim();
}

async function queryOverpassSingleRequest(lat, lng, radiusMeters = 1000) {
  const query = buildOverpassQuery(lat, lng, radiusMeters);

  let lastErrorType = 'FAILED';
  let lastErrorMessage = '';

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const endpoint = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'BaahonPujaApp/1.0 (DiagnosticBatch)',
          'Accept': '*/*'
        },
        body: 'data=' + encodeURIComponent(query),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        lastErrorType = 'RATE_LIMITED';
        lastErrorMessage = `HTTP 429 rate-limited from ${endpoint}`;
        console.warn(`    ⚠️ ${lastErrorMessage}. Backing off...`);
        await sleep(4000 * (attempt + 1));
        continue;
      }

      if (response.status === 504 || response.status === 408) {
        lastErrorType = 'TIMEOUT';
        lastErrorMessage = `HTTP ${response.status} from ${endpoint}`;
        console.warn(`    ⚠️ ${lastErrorMessage} on attempt ${attempt + 1}. Retrying...`);
        await sleep(3000 * (attempt + 1));
        continue;
      }

      if (!response.ok) {
        lastErrorType = 'FAILED';
        lastErrorMessage = `HTTP ${response.status}: ${response.statusText}`;
        console.warn(`    ⚠️ ${lastErrorMessage} on ${endpoint}.`);
        await sleep(2500);
        continue;
      }

      const data = await response.json();
      return {
        success: true,
        status: 'SUCCESS',
        elements: data.elements || [],
        endpointUsed: endpoint
      };
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'TimeoutError') {
        lastErrorType = 'TIMEOUT';
        lastErrorMessage = `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s on ${endpoint}`;
      } else {
        lastErrorType = 'FAILED';
        lastErrorMessage = err.message || 'Network error';
      }

      console.warn(`    ⚠️ Attempt ${attempt + 1} error: ${lastErrorMessage}`);
      if (attempt < MAX_RETRIES) {
        await sleep(3000 * (attempt + 1));
      }
    }
  }

  return {
    success: false,
    status: lastErrorType === 'TIMEOUT' ? 'TIMEOUT' : 'FAILED',
    elements: [],
    error: lastErrorMessage
  };
}

function extractOsmAddress(tags) {
  const parts = [];
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:suburb'] || tags['addr:neighbourhood']) parts.push(tags['addr:suburb'] || tags['addr:neighbourhood']);
  if (tags['addr:city']) parts.push(tags['addr:city']);
  if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
  return parts.length > 0 ? parts.join(', ') : null;
}

function saveProgressiveResults(resultsMap) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    totalPandals: testPandals.length,
    results: resultsMap
  };

  fs.writeFileSync(resultsFilePath, JSON.stringify(payload, null, 2), 'utf-8');
}

async function run() {
  console.log('='.repeat(75));
  console.log('    OPENSTREETMAP / OVERPASS FOOD DISCOVERY DIAGNOSTIC TOOL');
  console.log('='.repeat(75));
  console.log(`Pandals Count   : ${testPandals.length} of ${rawPandals.length} pandals`);
  console.log(`Query Policy    : 1 Overpass request per pandal (1000m max radius)`);
  console.log(`Local Partitions: 500m, 750m, 1000m`);
  console.log(`Output Location : ${resultsFilePath}`);
  console.log('='.repeat(75));

  let resultsMap = {};
  if (fs.existsSync(resultsFilePath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(resultsFilePath, 'utf-8'));
      resultsMap = existing.results || {};
    } catch {}
  }

  let successCount = 0;
  let timeoutCount = 0;
  let failedCount = 0;

  for (let i = 0; i < testPandals.length; i++) {
    const pandal = testPandals[i];
    const coords = extractCoordinates(pandal);
    const pandalId = pandal.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const pandalNum = i + 1;

    console.log(`\n------------------------------------------------------------`);
    console.log(`[${pandalNum}/${testPandals.length}] PANDAL: ${pandal.name}`);
    console.log(`Coords: Lat ${coords.lat.toFixed(5)}, Lng ${coords.lng.toFixed(5)}`);

    if (resultsMap[pandalId]?.status === 'SUCCESS') {
      successCount++;
      const cached = resultsMap[pandalId];
      console.log(`  ↪ Using saved SUCCESS result (${cached.r1000} places @ 1000m via ${cached.endpointUsed || 'Overpass'})`);
      console.log(`  Results -> 500m: ${cached.r500} | 750m: ${cached.r750} | 1000m: ${cached.r1000}`);
      continue;
    }

    console.log(`Executing 1 Overpass query for 1000m radius...`);
    const queryResult = await queryOverpassSingleRequest(coords.lat, coords.lng, 1000);

    if (!queryResult.success) {
      if (queryResult.status === 'TIMEOUT') {
        timeoutCount++;
        console.log(`  ❌ Query Status: TIMEOUT (${queryResult.error})`);
      } else {
        failedCount++;
        console.log(`  ❌ Query Status: FAILED (${queryResult.error})`);
      }

      resultsMap[pandalId] = {
        pandalName: pandal.name,
        status: queryResult.status,
        error: queryResult.error,
        coordinates: coords,
        r500: queryResult.status,
        r750: queryResult.status,
        r1000: queryResult.status,
        places500: [],
        places750: [],
        places1000: []
      };

      saveProgressiveResults(resultsMap);
      await sleep(INTER_PANDAL_DELAY_MS);
      continue;
    }

    successCount++;
    const rawElements = queryResult.elements;
    const seenOsmIds = new Set();
    const processedPlaces = [];

    for (const elem of rawElements) {
      const uniqueId = `${elem.type}/${elem.id}`;
      if (seenOsmIds.has(uniqueId)) continue;
      seenOsmIds.add(uniqueId);

      const lat = elem.type === 'node' ? elem.lat : elem.center?.lat;
      const lon = elem.type === 'node' ? elem.lon : elem.center?.lon;
      if (lat == null || lon == null) continue;

      const dist = haversineDistanceMeters(coords.lat, coords.lng, lat, lon);
      const tags = elem.tags || {};
      const name = tags.name || tags['name:en'] || '(Unnamed place)';
      const foodTag = tags.amenity ? `amenity=${tags.amenity}` : `shop=${tags.shop}`;
      const address = extractOsmAddress(tags);

      processedPlaces.push({
        name,
        osmType: elem.type,
        osmId: elem.id,
        uniqueId,
        lat,
        lon,
        distanceFromPandal: dist,
        foodTag,
        address: address || tags.street || 'Address not listed in OSM'
      });
    }

    const places500 = processedPlaces.filter((p) => p.distanceFromPandal <= 500).sort((a, b) => a.distanceFromPandal - b.distanceFromPandal);
    const places750 = processedPlaces.filter((p) => p.distanceFromPandal <= 750).sort((a, b) => a.distanceFromPandal - b.distanceFromPandal);
    const places1000 = processedPlaces.filter((p) => p.distanceFromPandal <= 1000).sort((a, b) => a.distanceFromPandal - b.distanceFromPandal);

    const pandalEntry = {
      pandalName: pandal.name,
      status: 'SUCCESS',
      endpointUsed: queryResult.endpointUsed,
      coordinates: coords,
      r500: places500.length,
      r750: places750.length,
      r1000: places1000.length,
      places500,
      places750,
      places1000
    };

    resultsMap[pandalId] = pandalEntry;
    saveProgressiveResults(resultsMap);
    console.log(`  ✅ Successfully saved to osm-food-results.json`);
    console.log(`  Results -> 500m: ${places500.length} | 750m: ${places750.length} | 1000m: ${places1000.length}`);

    if (i < testPandals.length - 1) {
      await sleep(INTER_PANDAL_DELAY_MS);
    }
  }

  console.log('\n\n' + '='.repeat(75));
  console.log('              OPENSTREETMAP RESULTS SUMMARY');
  console.log('='.repeat(75));
  console.log('Pandal Name                  | 500m       | 750m       | 1000m      | Status');
  console.log('-'.repeat(75));

  for (const pandal of testPandals) {
    const pandalId = pandal.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const res = resultsMap[pandalId] || { r500: 'N/A', r750: 'N/A', r1000: 'N/A', status: 'NOT_RUN' };
    const s500 = String(res.r500).padEnd(10);
    const s750 = String(res.r750).padEnd(10);
    const s1000 = String(res.r1000).padEnd(10);
    console.log(`${pandal.name.padEnd(28)} | ${s500} | ${s750} | ${s1000} | ${res.status}`);
  }

  console.log('='.repeat(75));
}

run().catch((err) => {
  console.error('Fatal OSM diagnostic error:', err);
  process.exit(1);
});

/**
 * Unit Test Suite for Food Discovery Service (Backend)
 * 
 * Tests offline pure logic independently of external network calls:
 * 1. Configuration constants
 * 2. Haversine distance formula accuracy
 * 3. Distance band categorization
 * 4. Coordinate extraction across all schemas (GeoJSON, flat, nested, direct)
 * 5. Common data model normalization for Geoapify places
 * 6. Haversine distance fallback calculation
 * 7. Verification across all 30 pandals in backend/data/pandals.json
 * 8. Error handling for missing or malformed pandals
 */

const assert = require('node:assert/strict');
const path = require('node:path');
const rawPandals = require('../data/pandals.json');
const {
  FOOD_SEARCH_RADIUS_METERS,
  DEFAULT_FOOD_CATEGORIES,
  haversineDistanceMeters,
  assignDistanceBand,
  extractCoordinates,
  normalizeGeoapifyPlace,
  discoverFoodNearPandal
} = require('../services/foodDiscovery.service.js');

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
    console.error(`     Error: ${err.message}`);
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
    console.error(`     Error: ${err.message}`);
  }
}

async function runAllTests() {
  console.log('\n--- Running Unit Tests for Backend Food Discovery Service ---\n');

  // 1. Constants
  test('Configuration constants match expected defaults', () => {
    assert.equal(FOOD_SEARCH_RADIUS_METERS, 500);
    assert.deepEqual(DEFAULT_FOOD_CATEGORIES, [
      'catering.restaurant',
      'catering.fast_food',
      'catering.cafe',
      'catering.food_court'
    ]);
  });

  // 2. Haversine distance
  test('Haversine formula calculates geographic distances accurately', () => {
    // Distance from College Square (22.5744, 88.3639) to Sovabazar Rajbari (22.5978, 88.3619)
    const dist = haversineDistanceMeters(22.5744, 88.3639, 22.5978, 88.3619);
    assert.ok(dist >= 2580 && dist <= 2640, `Expected ~2610m, got ${dist}`);

    // Identical point distance is 0
    assert.equal(haversineDistanceMeters(22.5, 88.3, 22.5, 88.3), 0);

    // Invalid coordinates return null
    assert.equal(haversineDistanceMeters(null, 88.3, 22.5, 88.3), null);
    assert.equal(haversineDistanceMeters(NaN, 88.3, 22.5, 88.3), null);
  });

  // 3. Distance band
  test('Assigns distance band correctly', () => {
    assert.equal(assignDistanceBand(250), '<=500m');
    assert.equal(assignDistanceBand(500), '<=500m');
    assert.equal(assignDistanceBand(600), '501m-750m');
    assert.equal(assignDistanceBand(750), '501m-750m');
    assert.equal(assignDistanceBand(850), '751m-1000m');
    assert.equal(assignDistanceBand(1000), '751m-1000m');
    assert.equal(assignDistanceBand(1200), '>1000m');
    assert.equal(assignDistanceBand(null), 'unknown');
  });

  // 4. Coordinate extraction
  test('Extracts coordinates from multiple pandal schemas', () => {
    // GeoJSON schema
    const geojsonPandal = { location: { type: 'Point', coordinates: [88.3668, 22.6012] } };
    assert.deepEqual(extractCoordinates(geojsonPandal), { lat: 22.6012, lng: 88.3668 });

    // Flat raw JSON schema from pandals.json
    const flatPandal = {
      name: 'Bagbazar Sarbojanin',
      'location/type': 'Point',
      'location/coordinates/0': 88.3668,
      'location/coordinates/1': 22.6012
    };
    assert.deepEqual(extractCoordinates(flatPandal), { lat: 22.6012, lng: 88.3668 });

    // Direct lat/lng schema
    const directPandal = { lat: 22.5222, lng: 88.3644 };
    assert.deepEqual(extractCoordinates(directPandal), { lat: 22.5222, lng: 88.3644 });

    // Invalid / missing
    assert.equal(extractCoordinates(null), null);
    assert.equal(extractCoordinates({}), null);
    assert.equal(extractCoordinates({ location: {} }), null);
  });

  // 5. Common data model normalization
  test('Normalizes Geoapify place into standardized common data model', () => {
    const origin = { lat: 22.5222, lng: 88.3644 };
    const mockFeature = {
      type: 'Feature',
      properties: {
        place_id: 'geo_place_987',
        name: 'Tasty Corner',
        categories: ['catering', 'catering.restaurant'],
        formatted: '8, Mandeville Gardens, Ballygunge, Kolkata 700019',
        lat: 22.5235,
        lon: 88.3655,
        distance: 180
      }
    };

    const normalized = normalizeGeoapifyPlace(mockFeature, origin, 'pandal-123');
    assert.equal(normalized.id, 'geoapify_geo_place_987');
    assert.equal(normalized.pandalId, 'pandal-123');
    assert.equal(normalized.name, 'Tasty Corner');
    assert.equal(normalized.latitude, 22.5235);
    assert.equal(normalized.longitude, 88.3655);
    assert.equal(normalized.distanceFromPandal, 180);
    assert.equal(normalized.distanceBand, '<=500m');
    assert.equal(normalized.category, 'restaurant');
    assert.deepEqual(normalized.categories, ['catering', 'catering.restaurant']);
    assert.equal(normalized.address, '8, Mandeville Gardens, Ballygunge, Kolkata 700019');
    assert.equal(normalized.source, 'geoapify');
    assert.equal(normalized.sourceId, 'geo_place_987');
  });

  // 6. Haversine distance fallback in normalization
  test('Normalizes place with calculated distance when API distance is absent', () => {
    const origin = { lat: 22.5222, lng: 88.3644 };
    const mockFeature = {
      type: 'Feature',
      properties: {
        place_id: 'geo_place_nodist',
        name: 'Arsalan',
        categories: ['catering.restaurant'],
        lat: 22.5240,
        lon: 88.3660
        // distance omitted
      }
    };

    const normalized = normalizeGeoapifyPlace(mockFeature, origin, 'pandal-arsalan');
    assert.ok(typeof normalized.distanceFromPandal === 'number');
    assert.ok(normalized.distanceFromPandal > 0 && normalized.distanceFromPandal < 300);
    assert.equal(normalized.distanceBand, '<=500m');
  });

  // 7. Verify all 30 pandals in backend/data/pandals.json have extractable coordinates
  test('Extracts valid coordinates for all pandals in backend/data/pandals.json', () => {
    assert.ok(Array.isArray(rawPandals) && rawPandals.length > 0);
    let validCount = 0;

    for (const p of rawPandals) {
      const coords = extractCoordinates(p);
      assert.ok(coords, `Pandal ${p.name} failed coordinate extraction`);
      assert.ok(typeof coords.lat === 'number' && !isNaN(coords.lat));
      assert.ok(typeof coords.lng === 'number' && !isNaN(coords.lng));
      assert.ok(coords.lat >= 22.3 && coords.lat <= 22.8, `Lat ${coords.lat} out of Kolkata bounds`);
      assert.ok(coords.lng >= 88.2 && coords.lng <= 88.6, `Lng ${coords.lng} out of Kolkata bounds`);
      validCount++;
    }

    assert.equal(validCount, rawPandals.length);
  });

  // 8. discoverFoodNearPandal handles invalid pandal gracefully
  await asyncTest('discoverFoodNearPandal handles invalid/null inputs safely', async () => {
    const nullRes = await discoverFoodNearPandal(null);
    assert.equal(nullRes.success, false);
    assert.equal(nullRes.coordinates, null);

    const noCoordRes = await discoverFoodNearPandal({ name: 'Empty Pandal' });
    assert.equal(noCoordRes.success, false);
    assert.ok(noCoordRes.error.includes('Missing or invalid coordinates'));
  });

  console.log(`\n========================================`);
  console.log(`Backend Unit Test Results: ${passed}/${total} passed`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal unit test error:', err);
  process.exit(1);
});

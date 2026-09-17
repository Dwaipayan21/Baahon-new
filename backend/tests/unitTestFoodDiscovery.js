/**
 * Unit Test Suite for Food Discovery Service (Backend)
 * 
 * Tests offline pure logic independently of external network calls:
 * 1. Configuration constants
 * 2. Haversine distance formula accuracy
 * 3. Distance band categorization with boundary values (0, 300, 301, 750, 751, 1000, 1001)
 * 4. Application category mapping & alcohol exclusion
 * 5. Coordinate extraction across all schemas (GeoJSON, flat, nested, direct)
 * 6. Common data model normalization for Geoapify places (11 fields)
 * 7. Deduplication (same sourceId, conservative geographic + name similarity)
 * 8. Verification across all 30 pandals in backend/data/pandals.json
 * 9. Error handling for missing or malformed pandals
 */

const assert = require('node:assert/strict');
const rawPandals = require('../data/pandals.json');
const {
  FOOD_SEARCH_RADIUS_METERS,
  DEFAULT_FOOD_CATEGORIES,
  CATEGORY_MAP,
  EXCLUDED_ALCOHOL_CATEGORIES,
  haversineDistanceMeters,
  assignDistanceBand,
  mapToApplicationCategory,
  extractCoordinates,
  normalizeGeoapifyPlace,
  isDuplicatePlace,
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
    assert.ok(DEFAULT_FOOD_CATEGORIES.includes('catering.restaurant'));
    assert.ok(DEFAULT_FOOD_CATEGORIES.includes('catering.cafe'));
    assert.ok(DEFAULT_FOOD_CATEGORIES.includes('catering.fast_food'));
    assert.ok(DEFAULT_FOOD_CATEGORIES.includes('catering.food_court'));
    assert.ok(DEFAULT_FOOD_CATEGORIES.includes('catering.ice_cream'));
    assert.ok(DEFAULT_FOOD_CATEGORIES.includes('commercial.food_and_drink.bakery'));
    assert.ok(DEFAULT_FOOD_CATEGORIES.includes('commercial.food_and_drink.confectionery'));
  });

  // 2. Haversine distance
  test('Haversine formula calculates geographic distances accurately', () => {
    // College Square (22.5744, 88.3639) to Sovabazar Rajbari (22.5978, 88.3619)
    const dist = haversineDistanceMeters(22.5744, 88.3639, 22.5978, 88.3619);
    assert.ok(dist >= 2580 && dist <= 2640, `Expected ~2610m, got ${dist}`);

    // Identical point distance is 0
    assert.equal(haversineDistanceMeters(22.5, 88.3, 22.5, 88.3), 0);

    // Invalid coordinates return null
    assert.equal(haversineDistanceMeters(null, 88.3, 22.5, 88.3), null);
    assert.equal(haversineDistanceMeters(NaN, 88.3, 22.5, 88.3), null);
  });

  // 3. Distance bands with exact boundary values
  test('Assigns deterministic distance bands at exact boundary thresholds', () => {
    // 0–300m: very_nearby
    assert.equal(assignDistanceBand(0), 'very_nearby', '0m should be very_nearby');
    assert.equal(assignDistanceBand(150), 'very_nearby', '150m should be very_nearby');
    assert.equal(assignDistanceBand(300), 'very_nearby', '300m boundary should be very_nearby');

    // >300–750m: nearby
    assert.equal(assignDistanceBand(301), 'nearby', '301m should be nearby');
    assert.equal(assignDistanceBand(500), 'nearby', '500m should be nearby');
    assert.equal(assignDistanceBand(750), 'nearby', '750m boundary should be nearby');

    // >750–1000m: further
    assert.equal(assignDistanceBand(751), 'further', '751m should be further');
    assert.equal(assignDistanceBand(900), 'further', '900m should be further');
    assert.equal(assignDistanceBand(1000), 'further', '1000m boundary should be further');

    // >1000m: beyond_1000m
    assert.equal(assignDistanceBand(1001), 'beyond_1000m', '1001m should be beyond_1000m');
    assert.equal(assignDistanceBand(2500), 'beyond_1000m', '2500m should be beyond_1000m');

    // Invalid / negative
    assert.equal(assignDistanceBand(null), 'unknown');
    assert.equal(assignDistanceBand(-10), 'unknown');
  });

  // 4. Category mapping and alcohol filtering
  test('Maps categories properly and excludes alcohol-centric establishments', () => {
    // Valid food categories
    assert.equal(mapToApplicationCategory(['catering.restaurant']), 'restaurant');
    assert.equal(mapToApplicationCategory(['catering.cafe']), 'cafe');
    assert.equal(mapToApplicationCategory(['catering.fast_food']), 'fast_food');
    assert.equal(mapToApplicationCategory(['catering.ice_cream']), 'ice_cream');
    assert.equal(mapToApplicationCategory(['catering.food_court']), 'food_court');
    assert.equal(mapToApplicationCategory(['commercial.food_and_drink.bakery']), 'bakery');
    assert.equal(mapToApplicationCategory(['commercial.food_and_drink.confectionery']), 'confectionery');

    // Excluded alcohol categories
    assert.equal(mapToApplicationCategory(['catering.bar']), null, 'Bars must be excluded');
    assert.equal(mapToApplicationCategory(['catering.pub']), null, 'Pubs must be excluded');
    assert.equal(mapToApplicationCategory(['commercial.food_and_drink.alcohol']), null, 'Alcohol shops must be excluded');
  });

  // 5. Coordinate extraction across all schemas
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

  // 6. Common data model normalization
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
    assert.equal(normalized.distanceBand, 'very_nearby');
    assert.equal(normalized.category, 'restaurant');
    assert.equal(normalized.address, '8, Mandeville Gardens, Ballygunge, Kolkata 700019');
    assert.equal(normalized.source, 'geoapify');
    assert.equal(normalized.sourceId, 'geo_place_987');
  });

  // 7. Normalization skips bars/pubs
  test('Normalization filters out bar/pub features', () => {
    const origin = { lat: 22.5222, lng: 88.3644 };
    const barFeature = {
      type: 'Feature',
      properties: {
        place_id: 'geo_bar_123',
        name: 'Night Pub',
        categories: ['catering.bar', 'catering.pub'],
        lat: 22.5235,
        lon: 88.3655,
        distance: 100
      }
    };

    assert.equal(normalizeGeoapifyPlace(barFeature, origin, 'pandal-123'), null);
  });

  // 8. Deduplication logic
  test('Deduplication identifies exact source ID duplicates and near-duplicates conservatively', () => {
    const existing = [
      {
        id: 'geoapify_1',
        source: 'geoapify',
        sourceId: 'place_101',
        name: 'Mystic Yoga Cafe',
        latitude: 22.51758,
        longitude: 88.35944
      }
    ];

    // Same sourceId => Duplicate
    assert.equal(isDuplicatePlace({ source: 'geoapify', sourceId: 'place_101', name: 'Other', latitude: 22.5, longitude: 88.3 }, existing), true);

    // Nearby (10m) with similar name => Duplicate
    const nearDuplicate = {
      source: 'geoapify',
      sourceId: 'place_102',
      name: 'Mystic Yoga Cafe & Studio',
      latitude: 22.51752,
      longitude: 88.35950
    };
    assert.equal(isDuplicatePlace(nearDuplicate, existing), true);

    // Nearby but different business name => Keep both (false)
    const differentPlace = {
      source: 'geoapify',
      sourceId: 'place_103',
      name: 'Blue Tokai Coffee',
      latitude: 22.51750,
      longitude: 88.35940
    };
    assert.equal(isDuplicatePlace(differentPlace, existing), false);
  });

  // 9. Verify all 30 pandals in backend/data/pandals.json have valid extractable coordinates
  test('Extracts valid coordinates for all 30 pandals in backend/data/pandals.json', () => {
    assert.ok(Array.isArray(rawPandals) && rawPandals.length === 30, 'Expected exactly 30 pandals in seed data');
    let validCount = 0;

    for (const p of rawPandals) {
      const coords = extractCoordinates(p);
      assert.ok(coords, `Pandal "${p.name}" failed coordinate extraction`);
      assert.ok(typeof coords.lat === 'number' && !isNaN(coords.lat));
      assert.ok(typeof coords.lng === 'number' && !isNaN(coords.lng));
      assert.ok(coords.lat >= 22.3 && coords.lat <= 22.8, `Lat ${coords.lat} out of Kolkata bounds for ${p.name}`);
      assert.ok(coords.lng >= 88.2 && coords.lng <= 88.6, `Lng ${coords.lng} out of Kolkata bounds for ${p.name}`);
      validCount++;
    }

    assert.equal(validCount, 30);
  });

  // 10. discoverFoodNearPandal handles invalid pandal gracefully
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

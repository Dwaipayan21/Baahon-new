/**
 * Food Discovery Service (Backend)
 * 
 * Modular service for discovering nearby food establishments (restaurants, cafes, fast food, food courts)
 * around Durga Puja pandals using the Geoapify Places API (v2).
 * 
 * ARCHITECTURE & SECURITY:
 * - Server-side only (CommonJS module).
 * - Reads API key strictly from process.env.GEOAPIFY_API_KEY.
 * - Never exposes API keys to client-side bundles or frontend code.
 * - Produces a normalized, database-ready food place schema.
 */

const FOOD_SEARCH_RADIUS_METERS = 500;
const GEOAPIFY_PLACES_API_URL = 'https://api.geoapify.com/v2/places';

/**
 * Supported Geoapify catering categories.
 */
const DEFAULT_FOOD_CATEGORIES = Object.freeze([
  'catering.restaurant',
  'catering.fast_food',
  'catering.cafe',
  'catering.food_court'
]);

/**
 * Calculates straight-line distance in meters between two geographical coordinates
 * using the Haversine formula.
 * 
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number|null} Distance in meters (rounded), or null if invalid
 */
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  if (
    typeof lat1 !== 'number' || typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' || typeof lon2 !== 'number' ||
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
  ) {
    return null;
  }

  const toRad = (angle) => (angle * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Assigns a distance band string based on distance in meters.
 * 
 * @param {number|null} distanceMeters
 * @returns {string}
 */
function assignDistanceBand(distanceMeters) {
  if (typeof distanceMeters !== 'number' || isNaN(distanceMeters)) return 'unknown';
  if (distanceMeters <= 500) return '<=500m';
  if (distanceMeters <= 750) return '501m-750m';
  if (distanceMeters <= 1000) return '751m-1000m';
  return '>1000m';
}

/**
 * Safely extracts { lat, lng } from a pandal object across various schemas:
 * 1. GeoJSON: pandal.location.coordinates -> [lng, lat]
 * 2. Flat raw JSON: pandal['location/coordinates/1'] (lat) & pandal['location/coordinates/0'] (lng)
 * 3. Direct properties: pandal.lat & pandal.lng
 * 4. Nested coords: pandal.coords.lat & pandal.coords.lng
 * 
 * @param {object} pandal Pandal object or Mongoose document
 * @returns {{ lat: number, lng: number }|null}
 */
function extractCoordinates(pandal) {
  if (!pandal || typeof pandal !== 'object') return null;

  // 1. Direct lat/lng properties
  if (typeof pandal.lat === 'number' && typeof pandal.lng === 'number' && !isNaN(pandal.lat) && !isNaN(pandal.lng)) {
    return { lat: pandal.lat, lng: pandal.lng };
  }

  // 2. GeoJSON format: location.coordinates is [lng, lat]
  if (pandal.location?.coordinates && Array.isArray(pandal.location.coordinates)) {
    const [lng, lat] = pandal.location.coordinates;
    if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  // 3. Raw flattened keys from pandals.json
  if (
    typeof pandal['location/coordinates/1'] === 'number' &&
    typeof pandal['location/coordinates/0'] === 'number'
  ) {
    return {
      lat: pandal['location/coordinates/1'],
      lng: pandal['location/coordinates/0']
    };
  }

  // 4. Nested coords object
  if (pandal.coords && typeof pandal.coords.lat === 'number' && typeof pandal.coords.lng === 'number') {
    return { lat: pandal.coords.lat, lng: pandal.coords.lng };
  }

  return null;
}

/**
 * Normalizes a raw Geoapify GeoJSON feature into the common standardized data model:
 * {
 *   id,
 *   pandalId,
 *   name,
 *   latitude,
 *   longitude,
 *   distanceFromPandal,
 *   distanceBand,
 *   category,
 *   categories,
 *   address,
 *   source,
 *   sourceId
 * }
 * 
 * @param {object} feature GeoJSON Feature object returned by Geoapify Places API
 * @param {{ lat: number, lng: number }} originCoords Pandal coordinates
 * @param {string|null} [pandalId=null] ID of associated pandal
 * @returns {object|null} Normalized food place object or null if invalid
 */
function normalizeGeoapifyPlace(feature, originCoords, pandalId = null) {
  if (!feature || typeof feature !== 'object') return null;

  const props = feature.properties || {};
  const geomCoords = feature.geometry?.coordinates;

  const lon = typeof props.lon === 'number' ? props.lon : (Array.isArray(geomCoords) ? geomCoords[0] : null);
  const lat = typeof props.lat === 'number' ? props.lat : (Array.isArray(geomCoords) ? geomCoords[1] : null);

  if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
    return null;
  }

  const name = props.name || props.address_line1 || props.formatted?.split(',')[0] || 'Unnamed Food Place';

  // Distance from pandal (API provides it when proximity bias is used; fallback to Haversine)
  let distanceMeters = typeof props.distance === 'number' ? Math.round(props.distance) : null;
  if (distanceMeters === null && originCoords) {
    distanceMeters = haversineDistanceMeters(originCoords.lat, originCoords.lng, lat, lon);
  }

  const categories = Array.isArray(props.categories) ? props.categories : [];
  const primaryFull = categories.find((c) => c.startsWith('catering.')) || categories[0] || 'catering.restaurant';
  const shortCategory = primaryFull.replace(/^catering\./, '');

  const sourceId = props.place_id || `${lat.toFixed(6)}_${lon.toFixed(6)}`;
  const id = `geoapify_${sourceId}`;

  return {
    id,
    pandalId: pandalId ? String(pandalId) : null,
    name,
    latitude: lat,
    longitude: lon,
    distanceFromPandal: distanceMeters,
    distanceBand: assignDistanceBand(distanceMeters),
    category: shortCategory,
    categories,
    address: props.formatted || props.address_line2 || props.street || '',
    source: 'geoapify',
    sourceId
  };
}

/**
 * Queries Geoapify Places API for food places around given coordinates.
 * 
 * @param {{ lat: number, lng: number }} coords Coordinates { lat, lng }
 * @param {object} [options]
 * @param {number} [options.radiusMeters=500] Search radius in meters
 * @param {string[]} [options.categories] Array of Geoapify category identifiers
 * @param {number} [options.limit=20] Max results
 * @param {string} [options.apiKey] API key override (defaults to process.env.GEOAPIFY_API_KEY)
 * @param {string} [options.pandalId] Associated pandal ID
 * @returns {Promise<{ places: object[], rawCount: number, error: string|null }>}
 */
async function fetchFoodPlacesNearCoordinates(coords, options = {}) {
  const radius = options.radiusMeters ?? FOOD_SEARCH_RADIUS_METERS;
  const categories = options.categories ?? DEFAULT_FOOD_CATEGORIES;
  const limit = options.limit ?? 20;
  const pandalId = options.pandalId ?? null;

  const apiKey = options.apiKey || process.env.GEOAPIFY_API_KEY;

  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return {
      places: [],
      rawCount: 0,
      error: 'Invalid coordinates provided. Expected { lat: number, lng: number }.'
    };
  }

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return {
      places: [],
      rawCount: 0,
      error: 'GEOAPIFY_API_KEY is not set in the server environment.'
    };
  }

  const params = new URLSearchParams({
    categories: categories.join(','),
    filter: `circle:${coords.lng},${coords.lat},${radius}`,
    bias: `proximity:${coords.lng},${coords.lat}`,
    limit: String(limit),
    apiKey: apiKey.trim()
  });

  const requestUrl = `${GEOAPIFY_PLACES_API_URL}?${params.toString()}`;

  let response;
  try {
    response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
  } catch (netErr) {
    return {
      places: [],
      rawCount: 0,
      error: `Network error connecting to Geoapify Places API: ${netErr.message || netErr}`
    };
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errBody = await response.json();
      errorDetail = errBody.message || JSON.stringify(errBody);
    } catch {
      errorDetail = response.statusText;
    }

    if (response.status === 401 || response.status === 403) {
      return {
        places: [],
        rawCount: 0,
        error: `Geoapify authentication failed (HTTP ${response.status}): Invalid or unauthorized API key.`
      };
    }

    if (response.status === 429) {
      return {
        places: [],
        rawCount: 0,
        error: 'Geoapify quota or rate limit exceeded (HTTP 429).'
      };
    }

    return {
      places: [],
      rawCount: 0,
      error: `Geoapify API request failed with HTTP ${response.status}: ${errorDetail}`
    };
  }

  let data;
  try {
    data = await response.json();
  } catch (parseErr) {
    return {
      places: [],
      rawCount: 0,
      error: `Malformed JSON response from Geoapify API: ${parseErr.message}`
    };
  }

  if (!data || !Array.isArray(data.features)) {
    return {
      places: [],
      rawCount: 0,
      error: 'Malformed response: Missing features array in Geoapify payload.'
    };
  }

  // Normalize, deduplicate by sourceId / unique fingerprint
  const seenPlaceIds = new Set();
  const normalizedPlaces = [];

  for (const feature of data.features) {
    const place = normalizeGeoapifyPlace(feature, coords, pandalId);
    if (!place) continue;

    const dedupeKey = place.sourceId || `${place.name.toLowerCase().trim()}_${place.latitude.toFixed(4)}_${place.longitude.toFixed(4)}`;
    if (seenPlaceIds.has(dedupeKey)) continue;
    seenPlaceIds.add(dedupeKey);

    normalizedPlaces.push(place);
  }

  // Sort ascending by distanceFromPandal
  normalizedPlaces.sort((a, b) => (a.distanceFromPandal ?? Infinity) - (b.distanceFromPandal ?? Infinity));

  return {
    places: normalizedPlaces,
    rawCount: data.features.length,
    error: null
  };
}

/**
 * Discovers nearby food places around a single pandal object.
 * 
 * @param {object} pandal Pandal object or Mongoose document
 * @param {object} [options]
 * @returns {Promise<object>} Discovery result summary
 */
async function discoverFoodNearPandal(pandal, options = {}) {
  if (!pandal) {
    return {
      success: false,
      pandalId: null,
      pandalName: 'Unknown',
      coordinates: null,
      error: 'Pandal object is null or undefined.',
      places: []
    };
  }

  const coords = extractCoordinates(pandal);
  const pandalId = pandal._id ? String(pandal._id) : (pandal.id || pandal.name);
  const pandalName = pandal.name || 'Unknown Pandal';

  if (!coords) {
    return {
      success: false,
      pandalId,
      pandalName,
      coordinates: null,
      error: `Missing or invalid coordinates for pandal: "${pandalName}".`,
      places: []
    };
  }

  const result = await fetchFoodPlacesNearCoordinates(coords, {
    ...options,
    pandalId
  });

  return {
    success: result.error === null,
    pandalId,
    pandalName,
    coordinates: coords,
    radiusMeters: options.radiusMeters ?? FOOD_SEARCH_RADIUS_METERS,
    totalFound: result.places.length,
    places: result.places,
    error: result.error
  };
}

/**
 * Discovers nearby food places for an array of pandals sequentially.
 * 
 * @param {object[]} pandals Array of pandal objects
 * @param {object} [options] Discovery options
 * @param {number} [options.requestDelayMs=250] Delay between pandal queries
 * @returns {Promise<object[]>} Array of discovery summaries
 */
async function discoverFoodForPandals(pandals, options = {}) {
  if (!Array.isArray(pandals)) {
    throw new Error('Expected pandals array as first argument.');
  }

  const results = [];
  const delayMs = options.requestDelayMs ?? 250;

  for (let i = 0; i < pandals.length; i++) {
    const pandal = pandals[i];
    const summary = await discoverFoodNearPandal(pandal, options);
    results.push(summary);

    if (i < pandals.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

module.exports = {
  FOOD_SEARCH_RADIUS_METERS,
  GEOAPIFY_PLACES_API_URL,
  DEFAULT_FOOD_CATEGORIES,
  haversineDistanceMeters,
  assignDistanceBand,
  extractCoordinates,
  normalizeGeoapifyPlace,
  fetchFoodPlacesNearCoordinates,
  discoverFoodNearPandal,
  discoverFoodForPandals
};

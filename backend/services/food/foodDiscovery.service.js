const FOOD_SEARCH_RADIUS_METERS = 1000;
const GEOAPIFY_PLACES_API_URL = "https://api.geoapify.com/v2/places";

const DEFAULT_FOOD_CATEGORIES = Object.freeze([
  "catering.restaurant",
  "catering.fast_food",
  "catering.cafe",
  "catering.food_court",
  "catering.ice_cream",
  "commercial.food_and_drink.bakery",
  "commercial.food_and_drink.confectionery",
]);

const CATEGORY_MAP = Object.freeze({
  "catering.restaurant": "restaurant",
  "catering.cafe": "cafe",
  "catering.fast_food": "fast_food",
  "catering.ice_cream": "ice_cream",
  "catering.food_court": "food_court",
  "catering.bakery": "bakery",
  "commercial.food_and_drink.bakery": "bakery",
  "catering.confectionery": "confectionery",
  "commercial.food_and_drink.confectionery": "confectionery",
});

const EXCLUDED_ALCOHOL_CATEGORIES = Object.freeze([
  "catering.bar",
  "catering.pub",
  "catering.biergarten",
  "catering.taproom",
  "commercial.food_and_drink.alcohol",
  "commercial.food_and_drink.beverages",
]);

function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  if (
    typeof lat1 !== "number" ||
    typeof lon1 !== "number" ||
    typeof lat2 !== "number" ||
    typeof lon2 !== "number" ||
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return null;
  }

  const toRad = (angle) => (angle * Math.PI) / 180;
  const R = 6371000;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(dLon / 2) ** 2;

  return Math.round(
    R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

function assignDistanceBand(distanceMeters) {
  if (
    typeof distanceMeters !== "number" ||
    !Number.isFinite(distanceMeters) ||
    distanceMeters < 0
  ) {
    return "unknown";
  }

  if (distanceMeters <= 300) return "very_nearby";
  if (distanceMeters <= 750) return "nearby";
  if (distanceMeters <= 1000) return "further";
  return "beyond_1000m";
}

function mapToApplicationCategory(categories) {
  if (!Array.isArray(categories) || categories.length === 0) return null;

  const hasFoodCategory = categories.some((category) => CATEGORY_MAP[category]);
  const isAlcoholOriented = categories.some((category) =>
    EXCLUDED_ALCOHOL_CATEGORIES.includes(category)
  );

  if (isAlcoholOriented && !hasFoodCategory) return null;

  for (const category of categories) {
    if (CATEGORY_MAP[category]) return CATEGORY_MAP[category];
  }

  return null;
}

function extractCoordinates(pandal) {
  if (!pandal || typeof pandal !== "object") return null;

  if (
    typeof pandal.lat === "number" &&
    typeof pandal.lng === "number" &&
    Number.isFinite(pandal.lat) &&
    Number.isFinite(pandal.lng)
  ) {
    return {
      lat: pandal.lat,
      lng: pandal.lng,
    };
  }

  if (Array.isArray(pandal.location?.coordinates)) {
    const [lng, lat] = pandal.location.coordinates;

    if (
      typeof lat === "number" &&
      typeof lng === "number" &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    ) {
      return { lat, lng };
    }
  }

  if (
    typeof pandal["location/coordinates/1"] === "number" &&
    typeof pandal["location/coordinates/0"] === "number"
  ) {
    return {
      lat: pandal["location/coordinates/1"],
      lng: pandal["location/coordinates/0"],
    };
  }

  if (
    typeof pandal.coords?.lat === "number" &&
    typeof pandal.coords?.lng === "number"
  ) {
    return {
      lat: pandal.coords.lat,
      lng: pandal.coords.lng,
    };
  }

  return null;
}

function normalizeGeoapifyPlace(feature, originCoords, pandalId = null) {
  if (!feature || typeof feature !== "object") return null;

  const props = feature.properties || {};
  const geometryCoordinates = feature.geometry?.coordinates;

  const lon =
    typeof props.lon === "number"
      ? props.lon
      : Array.isArray(geometryCoordinates)
        ? geometryCoordinates[0]
        : null;

  const lat =
    typeof props.lat === "number"
      ? props.lat
      : Array.isArray(geometryCoordinates)
        ? geometryCoordinates[1]
        : null;

  if (
    typeof lat !== "number" ||
    typeof lon !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {
    return null;
  }

  const categories = Array.isArray(props.categories)
    ? props.categories
    : [];

  const category = mapToApplicationCategory(categories);

  if (!category) return null;

  const name =
    props.name ||
    props.address_line1 ||
    props.formatted?.split(",")[0] ||
    "Unnamed Food Place";

  let distanceMeters =
    typeof props.distance === "number"
      ? Math.round(props.distance)
      : null;

  if (distanceMeters === null && originCoords) {
    distanceMeters = haversineDistanceMeters(
      originCoords.lat,
      originCoords.lng,
      lat,
      lon
    );
  }

  const sourceId =
    props.place_id || `${lat.toFixed(6)}_${lon.toFixed(6)}`;

  return {
    id: `geoapify_${sourceId}`,
    pandalId: pandalId ? String(pandalId) : null,
    name,
    latitude: lat,
    longitude: lon,
    distanceFromPandal: distanceMeters,
    distanceBand: assignDistanceBand(distanceMeters),
    category,
    address:
      props.formatted ||
      props.address_line2 ||
      props.street ||
      "",
    source: "geoapify",
    sourceId,
  };
}

function isDuplicatePlace(place, existingPlaces) {
  if (!place || !Array.isArray(existingPlaces)) return false;

  for (const existing of existingPlaces) {
    if (
      place.source === existing.source &&
      place.sourceId === existing.sourceId
    ) {
      return true;
    }

    const distance = haversineDistanceMeters(
      place.latitude,
      place.longitude,
      existing.latitude,
      existing.longitude
    );

    if (distance !== null && distance <= 30) {
      const name1 = place.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      const name2 = existing.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      if (
        name1 &&
        name2 &&
        (name1 === name2 ||
          name1.includes(name2) ||
          name2.includes(name1))
      ) {
        return true;
      }
    }
  }

  return false;
}

async function fetchFoodPlacesNearCoordinates(coords, options = {}) {
  const radius = options.radiusMeters ?? FOOD_SEARCH_RADIUS_METERS;
  const categories = options.categories ?? DEFAULT_FOOD_CATEGORIES;
  const limit = options.limit ?? 25;
  const pandalId = options.pandalId ?? null;
  const apiKey = options.apiKey || process.env.GEOAPIFY_API_KEY;

  if (
    !coords ||
    typeof coords.lat !== "number" ||
    typeof coords.lng !== "number"
  ) {
    return {
      places: [],
      rawCount: 0,
      error:
        "Invalid coordinates provided. Expected { lat: number, lng: number }.",
    };
  }

  if (!apiKey?.trim()) {
    return {
      places: [],
      rawCount: 0,
      error:
        "GEOAPIFY_API_KEY is not configured in the server environment.",
    };
  }

  const params = new URLSearchParams({
    categories: categories.join(","),
    filter: `circle:${coords.lng},${coords.lat},${radius}`,
    bias: `proximity:${coords.lng},${coords.lat}`,
    limit: String(limit),
    apiKey: apiKey.trim(),
  });

  let response;

  try {
    response = await fetch(
      `${GEOAPIFY_PLACES_API_URL}?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );
  } catch (error) {
    return {
      places: [],
      rawCount: 0,
      error: `Network error connecting to Geoapify Places API: ${
        error.message || error
      }`,
    };
  }

  if (!response.ok) {
    let errorDetail = "";

    try {
      const errorBody = await response.json();
      errorDetail = errorBody.message || JSON.stringify(errorBody);
    } catch {
      errorDetail = response.statusText;
    }

    if (response.status === 401 || response.status === 403) {
      return {
        places: [],
        rawCount: 0,
        error: `Geoapify authentication failed (HTTP ${response.status}): Invalid or unauthorized API key.`,
      };
    }

    if (response.status === 429) {
      return {
        places: [],
        rawCount: 0,
        error:
          "Geoapify quota or rate limit exceeded (HTTP 429).",
      };
    }

    return {
      places: [],
      rawCount: 0,
      error: `Geoapify API request failed with HTTP ${response.status}: ${errorDetail}`,
    };
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    return {
      places: [],
      rawCount: 0,
      error: `Malformed JSON response from Geoapify API: ${error.message}`,
    };
  }

  if (!data || !Array.isArray(data.features)) {
    return {
      places: [],
      rawCount: 0,
      error:
        "Malformed response: Missing features array in Geoapify payload.",
    };
  }

  const normalizedPlaces = [];

  for (const feature of data.features) {
    const place = normalizeGeoapifyPlace(
      feature,
      coords,
      pandalId
    );

    if (!place || isDuplicatePlace(place, normalizedPlaces)) {
      continue;
    }

    normalizedPlaces.push(place);
  }

  normalizedPlaces.sort(
    (a, b) =>
      (a.distanceFromPandal ?? Infinity) -
      (b.distanceFromPandal ?? Infinity)
  );

  return {
    places: normalizedPlaces,
    rawCount: data.features.length,
    error: null,
  };
}

async function discoverFoodNearPandal(pandal, options = {}) {
  if (!pandal) {
    return {
      success: false,
      pandalId: null,
      pandalName: "Unknown",
      coordinates: null,
      error: "Pandal object is null or undefined.",
      places: [],
    };
  }

  const coordinates = extractCoordinates(pandal);
  const pandalId = pandal._id
    ? String(pandal._id)
    : pandal.id || pandal.name;

  const pandalName = pandal.name || "Unknown Pandal";

  if (!coordinates) {
    return {
      success: false,
      pandalId,
      pandalName,
      coordinates: null,
      error: `Missing or invalid coordinates for pandal: "${pandalName}".`,
      places: [],
    };
  }

  const result = await fetchFoodPlacesNearCoordinates(
    coordinates,
    {
      ...options,
      pandalId,
    }
  );

  return {
    success: result.error === null,
    pandalId,
    pandalName,
    coordinates,
    radiusMeters:
      options.radiusMeters ?? FOOD_SEARCH_RADIUS_METERS,
    totalFound: result.places.length,
    places: result.places,
    error: result.error,
  };
}

async function discoverFoodForPandals(pandals, options = {}) {
  if (!Array.isArray(pandals)) {
    throw new Error("Expected pandals array as first argument.");
  }

  const results = [];
  const delayMs = options.requestDelayMs ?? 250;

  for (let i = 0; i < pandals.length; i++) {
    results.push(
      await discoverFoodNearPandal(pandals[i], options)
    );

    if (i < pandals.length - 1 && delayMs > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, delayMs)
      );
    }
  }

  return results;
}

export {
  FOOD_SEARCH_RADIUS_METERS,
  GEOAPIFY_PLACES_API_URL,
  DEFAULT_FOOD_CATEGORIES,
  CATEGORY_MAP,
  EXCLUDED_ALCOHOL_CATEGORIES,
  haversineDistanceMeters,
  assignDistanceBand,
  mapToApplicationCategory,
  extractCoordinates,
  normalizeGeoapifyPlace,
  isDuplicatePlace,
  fetchFoodPlacesNearCoordinates,
  discoverFoodNearPandal,
  discoverFoodForPandals,
};
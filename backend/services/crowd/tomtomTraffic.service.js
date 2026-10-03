const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const trafficCache = new Map();
const inFlightRequests = new Map();

export async function getTrafficObservation(latitude, longitude) {
  const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;

  if (!TOMTOM_API_KEY) {
    throw new Error("TOMTOM_API_KEY is not configured");
  }

  const cacheKey = `${latitude},${longitude}`;

  // Check cached result first
  const cached = trafficCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`TomTom cache hit: ${cacheKey}`);
    return cached.data;
  }

  // If the same request is already running, reuse it
  const inFlightRequest = inFlightRequests.get(cacheKey);

  if (inFlightRequest) {
    console.log(`TomTom request already in progress: ${cacheKey}`);
    return inFlightRequest;
  }

  // Create and store the request promise
  const requestPromise = fetchTomTomTraffic(
    latitude,
    longitude,
    TOMTOM_API_KEY,
    cacheKey
  );

  inFlightRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

async function fetchTomTomTraffic(
  latitude,
  longitude,
  TOMTOM_API_KEY,
  cacheKey
) {
  const url =
    "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json" +
    `?point=${latitude},${longitude}&unit=KMPH&key=${encodeURIComponent(
      TOMTOM_API_KEY
    )}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `TomTom Traffic API failed: ${response.status} ${JSON.stringify(data)}`
    );
  }

  const flow = data.flowSegmentData;

  if (!flow) {
    throw new Error("TomTom returned no flowSegmentData");
  }

  const currentTravelTime = Number(flow.currentTravelTime);
  const freeFlowTravelTime = Number(flow.freeFlowTravelTime);

  const trafficRatio =
    freeFlowTravelTime > 0
      ? currentTravelTime / freeFlowTravelTime
      : null;

  let congestionScore = null;

  if (trafficRatio !== null) {
    congestionScore = Math.min(
      100,
      Math.max(0, ((trafficRatio - 1) / 1.5) * 100)
    );

    congestionScore = Number(congestionScore.toFixed(2));
  }

  const result = {
    currentSpeed: flow.currentSpeed,
    freeFlowSpeed: flow.freeFlowSpeed,
    currentTravelTime,
    freeFlowTravelTime,
    trafficRatio: trafficRatio
      ? Number(trafficRatio.toFixed(4))
      : null,
    congestionScore,
    confidence: flow.confidence ?? null,
    roadClosure: flow.roadClosure ?? false,
    provider: "tomtom",
  };

  // Save successful result in cache
  trafficCache.set(cacheKey, {
    data: result,
    timestamp: Date.now(),
  });

  return result;
}
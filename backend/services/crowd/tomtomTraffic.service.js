import { recordTomTomRequest } from "./tomtomUsage.service.js";

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const trafficCache = new Map();
const inFlightRequests = new Map();

export async function getTrafficObservation(
  latitude,
  longitude,
  requestLabel = `coordinates ${latitude}, ${longitude}`
) {
  const primaryApiKey = process.env.TOMTOM_API_KEY;
  const backupApiKey = process.env.TOMTOM_BACKUP_API_KEY;

  if (!primaryApiKey) {
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
  const requestPromise = fetchTomTomTrafficWithFailover(
    latitude,
    longitude,
    primaryApiKey,
    backupApiKey,
    cacheKey,
    requestLabel
  );

  inFlightRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

async function fetchTomTomTrafficWithFailover(
  latitude,
  longitude,
  primaryApiKey,
  backupApiKey,
  cacheKey,
  requestLabel
) {
  try {
    // Always try the primary key first
    return await fetchTomTomTraffic(
      latitude,
      longitude,
      primaryApiKey,
      cacheKey,
      requestLabel,
      "primary"
    );
  } catch (error) {
    // Only use backup when the primary key is actually
    // rate-limited or quota-exhausted.
    if (!isTomTomQuotaError(error)) {
      throw error;
    }

    if (!backupApiKey) {
      console.error(
        "[TomTom] Primary API quota/rate limit reached, but backup key is not configured."
      );

      throw error;
    }

    console.warn(
      "[TomTom] Primary API quota/rate limit reached. Switching to backup key."
    );

    return await fetchTomTomTraffic(
      latitude,
      longitude,
      backupApiKey,
      cacheKey,
      requestLabel,
      "backup"
    );
  }
}

async function fetchTomTomTraffic(
  latitude,
  longitude,
  apiKey,
  cacheKey,
  requestLabel,
  keyType
) {
  const url =
    "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json" +
    `?point=${latitude},${longitude}&unit=KMPH&key=${encodeURIComponent(
      apiKey
    )}`;

  recordTomTomRequest(`${requestLabel} [${keyType}]`);

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      `TomTom Traffic API failed: ${response.status} ${JSON.stringify(data)}`
    );

    // Keep the HTTP status available so the failover logic
    // can determine whether this was a quota/rate-limit error.
    error.status = response.status;
    error.tomtomData = data;

    throw error;
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
    trafficRatio:
      trafficRatio !== null
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

function isTomTomQuotaError(error) {
  const status = error?.status;

  // 429 = Too Many Requests / rate limit
  // 403 = commonly used for quota/access restrictions
  if (status === 429 || status === 403) {
    return true;
  }

  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("too many requests")
  );
}
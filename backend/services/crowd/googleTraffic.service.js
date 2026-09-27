const GOOGLE_ROUTES_URL =
  "https://routes.googleapis.com/directions/v2:computeRoutes";

function toWaypoint([longitude, latitude]) {
  return {
    location: {
      latLng: {
        latitude,
        longitude,
      },
    },
  };
}

function parseDuration(duration) {
  if (!duration) return null;

  return Number.parseFloat(
    duration.replace("s", "")
  );
}

export async function getTrafficObservation({
  samplePoint,
  pandalLocation,
}) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }

  const response = await fetch(GOOGLE_ROUTES_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,

      "X-Goog-FieldMask":
        "routes.duration,routes.staticDuration,routes.distanceMeters,routes.travelAdvisory",
    },

    body: JSON.stringify({
      origin: toWaypoint(
        samplePoint.location.coordinates
      ),

      destination: toWaypoint(
        pandalLocation.coordinates
      ),

      travelMode: "DRIVE",

      routingPreference: "TRAFFIC_AWARE",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
      `Google Routes API failed with ${response.status}`
    );
  }

  if (!data.routes?.length) {
    return {
      congestionLevel: "UNKNOWN",
      congestionScore: null,
      durationSeconds: null,
      staticDurationSeconds: null,
      trafficRatio: null,
    };
  }

  const route = data.routes[0];

  const durationSeconds =
    parseDuration(route.duration);

  const staticDurationSeconds =
    parseDuration(route.staticDuration);

  let trafficRatio = null;

  if (
    durationSeconds !== null &&
    staticDurationSeconds !== null &&
    staticDurationSeconds > 0
  ) {
    trafficRatio =
      durationSeconds / staticDurationSeconds;
  }

  return {
    congestionLevel: classifyTraffic(trafficRatio),

    congestionScore:
      calculateCongestionScore(trafficRatio),

    durationSeconds,

    staticDurationSeconds,

    trafficRatio,
  };
}

function classifyTraffic(ratio) {
  if (ratio === null) {
    return "UNKNOWN";
  }

  if (ratio < 1.15) {
    return "NORMAL";
  }

  if (ratio < 1.50) {
    return "SLOW";
  }

  return "TRAFFIC_JAM";
}

function calculateCongestionScore(ratio) {
  if (ratio === null) {
    return null;
  }

  if (ratio <= 1) {
    return 0;
  }

  const score = ((ratio - 1) / 1.5) * 100;

  return Math.min(
    100,
    Math.round(score * 100) / 100
  );
}
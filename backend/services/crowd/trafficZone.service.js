import Pandal from "../../models/pandal.model.js";
import CrowdSample from "../../models/crowdSample.model.js";

const ZONE_RADIUS_METERS = 500;
const MAX_ZONE_REQUESTS_PER_REFRESH = 10;
const REFRESH_AFTER_MS = 30 * 60 * 1000;

/*
 * Keeps track of where the previous refresh stopped.
 *
 * This gives us round-robin zone rotation:
 *
 * refresh 1 → zones 1-10
 * refresh 2 → zones 11-20
 * refresh 3 → zones 21-30
 * ...
 *
 * The cursor resets if the server restarts.
 */
let refreshCursor = 0;

/**
 * Calculate approximate distance between two coordinates.
 *
 * Coordinates are [longitude, latitude].
 */
function distanceInMeters(pointA, pointB) {
  const [lon1, lat1] = pointA;
  const [lon2, lat2] = pointB;

  const R = 6371000;

  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Build traffic zones from existing pandal sample points.
 *
 * Nearby sample points are grouped together.
 */
export function buildTrafficZones(pandals) {
  const allPoints = [];

  for (const pandal of pandals) {
    const samplePoints = pandal.crowdSamplePoints || [];

    for (const samplePoint of samplePoints) {
      if (samplePoint.enabled === false) {
        continue;
      }

      if (
        !samplePoint.location ||
        !Array.isArray(samplePoint.location.coordinates) ||
        samplePoint.location.coordinates.length !== 2
      ) {
        continue;
      }

      allPoints.push({
        pandalId: pandal._id,
        pandalName: pandal.name,
        samplePointId: samplePoint.samplePointId,
        samplePointName: samplePoint.name,
        coordinates: samplePoint.location.coordinates,
      });
    }
  }

  const zones = [];

  for (const point of allPoints) {
    let matchedZone = null;

    for (const zone of zones) {
      const distance = distanceInMeters(
        point.coordinates,
        zone.center
      );

      if (distance <= ZONE_RADIUS_METERS) {
        matchedZone = zone;
        break;
      }
    }

    if (!matchedZone) {
      matchedZone = {
        zoneId: `zone-${zones.length + 1}`,
        center: [...point.coordinates],
        points: [],
      };

      zones.push(matchedZone);
    }

    matchedZone.points.push(point);
  }

  return zones;
}

/**
 * Get the latest CrowdSample for all sample points.
 */
async function getLatestSamples(zones) {
  const conditions = [];

  for (const zone of zones) {
    for (const point of zone.points) {
      conditions.push({
        pandalId: point.pandalId,
        samplePointId: point.samplePointId,
      });
    }
  }

  if (!conditions.length) {
    return new Map();
  }

  const samples = await CrowdSample.find({
    $or: conditions,
  })
    .sort({ observedAt: -1 })
    .lean();

  const latestByPoint = new Map();

  for (const sample of samples) {
    const key = `${sample.pandalId}:${sample.samplePointId}`;

    if (!latestByPoint.has(key)) {
      latestByPoint.set(key, sample);
    }
  }

  return latestByPoint;
}

/**
 * Select zones for refresh using round-robin rotation.
 *
 * Only stale/unobserved zones are eligible.
 *
 * The refresh cursor ensures that the system moves through
 * the zone list instead of repeatedly selecting the same
 * group of zones based only on timestamps.
 */
export async function selectZonesForRefresh(zones) {
  if (!zones.length) {
    return [];
  }

  const latestByPoint = await getLatestSamples(zones);
  const now = Date.now();

  const staleZones = [];

  for (let index = 0; index < zones.length; index++) {
    const zone = zones[index];

    let oldestObservedAt = null;

    for (const point of zone.points) {
      const key = `${point.pandalId}:${point.samplePointId}`;
      const latest = latestByPoint.get(key);

      /*
       * A zone with no sample is immediately considered stale.
       */
      if (!latest?.observedAt) {
        oldestObservedAt = 0;
        break;
      }

      const observedAt = new Date(
        latest.observedAt
      ).getTime();

      if (
        oldestObservedAt === null ||
        observedAt < oldestObservedAt
      ) {
        oldestObservedAt = observedAt;
      }
    }

    const isStale =
      oldestObservedAt === null ||
      oldestObservedAt === 0 ||
      now - oldestObservedAt >= REFRESH_AFTER_MS;

    if (isStale) {
      staleZones.push({
        zone,
        index,
        oldestObservedAt: oldestObservedAt || 0,
      });
    }
  }

  if (!staleZones.length) {
    return [];
  }

  /*
   * Sort stale zones according to their position in the
   * deterministic zone list.
   */
  staleZones.sort((a, b) => a.index - b.index);

  /*
   * Find stale zones starting from the current cursor.
   *
   * This creates circular/round-robin selection.
   */
  const rotatedCandidates = [];

  for (let offset = 0; offset < zones.length; offset++) {
    const index =
      (refreshCursor + offset) % zones.length;

    const candidate = staleZones.find(
      (item) => item.index === index
    );

    if (candidate) {
      rotatedCandidates.push(candidate);
    }
  }

  /*
   * Select at most the configured TomTom request budget.
   */
  const selectedCandidates = rotatedCandidates.slice(
    0,
    MAX_ZONE_REQUESTS_PER_REFRESH
  );

  /*
   * Move the cursor to the position immediately after
   * the last selected zone.
   */
  if (selectedCandidates.length) {
    const lastIndex =
      selectedCandidates[
        selectedCandidates.length - 1
      ].index;

    refreshCursor =
      (lastIndex + 1) % zones.length;
  }

  console.log(
    `Zone rotation cursor: ${refreshCursor}`
  );

  console.log(
    `Selected zones: ${selectedCandidates
      .map((candidate) => candidate.zone.zoneId)
      .join(", ")}`
  );

  return selectedCandidates.map(
    (candidate) => candidate.zone
  );
}

export function getZoneRequestLimit() {
  return MAX_ZONE_REQUESTS_PER_REFRESH;
}
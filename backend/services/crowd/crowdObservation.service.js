import Pandal from "../../models/pandal.model.js";
import CrowdSample from "../../models/crowdSample.model.js";
import { getTrafficObservation } from "./tomtomTraffic.service.js";

const CONCURRENCY = 3;
const POINTS_PER_REFRESH = 2;
const REFRESH_AFTER_MS = 30 * 60 * 1000;

export async function collectPandalCrowdObservations(pandalId) {
  const pandal = await Pandal.findById(pandalId).select(
    "_id name location crowdSamplePoints"
  );

  if (!pandal) {
    throw new Error("Pandal not found");
  }

  const samplePoints = pandal.crowdSamplePoints.filter(
    (point) => point.enabled !== false
  );

  if (!samplePoints.length) {
    return [];
  }

  const now = Date.now();

  const latestSamples = await CrowdSample.find({
    pandalId: pandal._id,
    samplePointId: {
      $in: samplePoints.map((point) => point.samplePointId),
    },
  })
    .sort({ observedAt: -1 })
    .lean();

  const latestByPoint = new Map();

  for (const sample of latestSamples) {
    if (!latestByPoint.has(sample.samplePointId)) {
      latestByPoint.set(sample.samplePointId, sample);
    }
  }

  const stalePoints = samplePoints.filter((point) => {
    const latest = latestByPoint.get(point.samplePointId);

    return (
      !latest?.observedAt ||
      now - new Date(latest.observedAt).getTime() >= REFRESH_AFTER_MS
    );
  });

  if (!stalePoints.length) {
    return [];
  }

  const pointsToRefresh = stalePoints
    .sort((a, b) => {
      const aTime = latestByPoint.get(a.samplePointId)?.observedAt;
      const bTime = latestByPoint.get(b.samplePointId)?.observedAt;

      return (
        new Date(aTime || 0).getTime() -
        new Date(bTime || 0).getTime()
      );
    })
    .slice(0, POINTS_PER_REFRESH);

  const results = [];

  for (let i = 0; i < pointsToRefresh.length; i += CONCURRENCY) {
    const batch = pointsToRefresh.slice(i, i + CONCURRENCY);

    const observations = await Promise.all(
      batch.map(async (samplePoint) => {
        const [longitude, latitude] = samplePoint.location.coordinates;

        const observation = await getTrafficObservation(
          latitude,
          longitude
        );

        if (observation.congestionScore === null) {
          return null;
        }

        const congestionLevel =
          observation.congestionScore < 30
            ? "NORMAL"
            : observation.congestionScore < 60
              ? "SLOW"
              : "TRAFFIC_JAM";

        return {
          pandalId: pandal._id,
          samplePointId: samplePoint.samplePointId,
          samplePointName: samplePoint.name,
          congestionLevel,
          congestionScore: observation.congestionScore,
          durationSeconds: observation.currentTravelTime,
          staticDurationSeconds: observation.freeFlowTravelTime,
          trafficRatio: observation.trafficRatio,
          source: "tomtom",
          observedAt: new Date(),
        };
      })
    );

    results.push(...observations.filter(Boolean));
  }

  if (results.length) {
    await CrowdSample.insertMany(results);
  }

  return results;
}
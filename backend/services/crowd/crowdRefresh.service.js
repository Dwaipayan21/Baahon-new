import Pandal from "../../models/pandal.model.js";
import CrowdSample from "../../models/crowdSample.model.js";
import { refreshPandalCrowd } from "./crowdEngine.service.js";
import { getZoneRequestLimit } from "./trafficZone.service.js";

const REFRESH_AFTER_MS = 30 * 60 * 1000;
const USABLE_OBSERVATION_WINDOW_MS = 35 * 60 * 1000;
const lastAttemptByPandal = new Map();

export async function refreshCrowdData() {
  const pandals = await Pandal.find({
    "crowdSamplePoints.0": { $exists: true },
  }).select("_id name crowdSamplePoints");

  if (!pandals.length) {
    console.log("No pandals available for crowd refresh.");
    return;
  }

  const pandalIds = pandals.map((pandal) => pandal._id);
  const samples = await CrowdSample.find({
    pandalId: { $in: pandalIds },
  }).sort({ observedAt: -1 }).lean();
  const samplesByPandal = new Map();

  for (const sample of samples) {
    const pandalId = String(sample.pandalId);
    const pandalSamples = samplesByPandal.get(pandalId) || [];

    pandalSamples.push(sample);
    samplesByPandal.set(pandalId, pandalSamples);
  }

  const now = Date.now();
  const candidates = pandals
    .map((pandal) => {
      const enabledPoints = (pandal.crowdSamplePoints || []).filter(
        (point) =>
          point.enabled !== false &&
          Array.isArray(point.location?.coordinates) &&
          point.location.coordinates.length === 2
      );
      const pandalSamples = samplesByPandal.get(String(pandal._id)) || [];
      const validSamples = pandalSamples.filter(
        (sample) => Number.isFinite(sample.congestionScore)
      );
      const hasUsableObservation = validSamples.some(
        (sample) =>
          now - new Date(sample.observedAt).getTime() <
          USABLE_OBSERVATION_WINDOW_MS
      );

      if (hasUsableObservation) {
        console.log(
          `[CACHE] ${pandal.name} → reused existing crowd observation`
        );
      }

      if (!enabledPoints.length || hasUsableObservation) {
        return null;
      }

      const lastObservedAt = pandalSamples.reduce(
        (latest, sample) =>
          sample.observedAt > latest ? sample.observedAt : latest,
        null
      );

      return {
        pandal,
        priority:
          pandalSamples.length === 0
            ? 0
            : validSamples.length === 0
              ? 1
              : 2,
        oldestObservationAt: lastObservedAt
          ? new Date(lastObservedAt).getTime()
          : 0,
        lastAttemptAt: lastAttemptByPandal.get(String(pandal._id)) || 0,
      };
    })
    .filter(
      (candidate) =>
        candidate && now - candidate.lastAttemptAt >= REFRESH_AFTER_MS
    )
    .sort(
      (a, b) => {
        const priorityDifference = a.priority - b.priority;

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        if (a.priority < 2 && a.lastAttemptAt !== b.lastAttemptAt) {
          return a.lastAttemptAt - b.lastAttemptAt;
        }

        return (
          a.oldestObservationAt - b.oldestObservationAt ||
          a.lastAttemptAt - b.lastAttemptAt
        );
      }
    );

  const requestLimit = getZoneRequestLimit();
  const selectedCandidates = candidates.slice(0, requestLimit);

  console.log(
    `Crowd refresh candidates: ${candidates.length}; selected: ${selectedCandidates.length}/${requestLimit}`
  );

  for (const candidate of selectedCandidates) {
    const pandalId = String(candidate.pandal._id);
    lastAttemptByPandal.set(pandalId, now);

    try {
      await refreshPandalCrowd(candidate.pandal._id);
    } catch (error) {
      console.error(
        `Crowd refresh failed for ${candidate.pandal.name}: ${error.message}`
      );
    }
  }
}
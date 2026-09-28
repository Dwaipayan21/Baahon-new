import CrowdSample from "../../models/crowdSample.model.js";

export async function getPandalCrowdStatus(pandal) {
  const observations = await CrowdSample.find({
    pandalId: pandal._id,
    congestionScore: { $ne: null },
    observedAt: {
      $gte: new Date(Date.now() - 15 * 60 * 1000),
    },
  }).lean();

  if (!observations.length) {
    return {
      status: "UNKNOWN",
      score: null,
      sampleCount: 0,
      observedAt: null,
    };
  }

  const weights = new Map(
    (pandal.crowdSamplePoints || []).map((point) => [
      point.samplePointId,
      point.weight ?? 1,
    ])
  );

  let weightedScore = 0;
  let totalWeight = 0;

  for (const observation of observations) {
    const weight = weights.get(observation.samplePointId) ?? 1;

    weightedScore += observation.congestionScore * weight;
    totalWeight += weight;
  }

  const score =
    totalWeight > 0
      ? Math.round((weightedScore / totalWeight) * 100) / 100
      : null;

  return {
    status: classifyCrowd(score),
    score,
    sampleCount: observations.length,
    observedAt: observations.reduce(
      (latest, observation) =>
        observation.observedAt > latest
          ? observation.observedAt
          : latest,
      observations[0].observedAt
    ),
  };
}

function classifyCrowd(score) {
  if (score === null) return "UNKNOWN";
  if (score < 30) return "LOW";
  if (score < 60) return "MODERATE";
  return "HIGH";
}
import Pandal from "../../models/pandal.model.js";
import CrowdSample from "../../models/crowdSample.model.js";
import { getTrafficObservation } from "./tomtomTraffic.service.js";
import {
  buildTrafficZones,
  selectZonesForRefresh,
  getZoneRequestLimit,
} from "./trafficZone.service.js";

function getCongestionLevel(score) {
  if (score < 30) {
    return "NORMAL";
  }

  if (score < 60) {
    return "SLOW";
  }

  return "TRAFFIC_JAM";
}

export async function refreshCrowdData() {
  const pandals = await Pandal.find({
    "crowdSamplePoints.0": { $exists: true },
  }).select("_id name crowdSamplePoints");

  console.log(
    `Refreshing crowd data for ${pandals.length} pandals...`
  );

  if (!pandals.length) {
    console.log("No pandals available for crowd refresh.");
    return;
  }

  /*
   * Build traffic zones from the existing crowd sample points.
   */
  const zones = buildTrafficZones(pandals);

  console.log(
    `Built ${zones.length} traffic zones from ${pandals.length} pandals.`
  );

  /*
   * Select zones using the round-robin refresh strategy.
   *
   * Only stale/unobserved zones are selected.
   *
   * The number of external TomTom requests remains capped.
   */
  const zonesToRefresh = await selectZonesForRefresh(zones);

  const requestLimit = getZoneRequestLimit();

  console.log(
    `Zones requiring refresh: ${zonesToRefresh.length}/${zones.length}`
  );

  console.log(
    `TomTom request budget: ${zonesToRefresh.length}/${requestLimit}`
  );

  if (!zonesToRefresh.length) {
    console.log("No traffic zones require refreshing.");
    return;
  }

  let updatedZones = 0;
  let failedZones = 0;
  let savedSamples = 0;

  /*
   * Process selected zones sequentially.
   *
   * This guarantees that we never exceed the global
   * request budget during this refresh cycle.
   */
  for (const zone of zonesToRefresh) {
    try {
      const [longitude, latitude] = zone.center;

      console.log(
        `Refreshing ${zone.zoneId} ` +
          `(${zone.points.length} sample points)`
      );

      /*
       * ONE TomTom request for the entire zone.
       */
      const observation = await getTrafficObservation(
        latitude,
        longitude
      );

      if (observation.congestionScore === null) {
        console.log(
          `SKIPPED ${zone.zoneId}: no congestion score`
        );

        continue;
      }

      const congestionLevel = getCongestionLevel(
        observation.congestionScore
      );

      /*
       * Apply the same traffic observation to the sample points
       * belonging to this zone.
       *
       * This preserves the existing CrowdSample structure and
       * therefore preserves the existing Crowd API.
       */
      const samples = zone.points.map((point) => ({
        pandalId: point.pandalId,
        samplePointId: point.samplePointId,
        samplePointName: point.samplePointName,

        congestionLevel,

        congestionScore: observation.congestionScore,

        durationSeconds: observation.currentTravelTime,

        staticDurationSeconds:
          observation.freeFlowTravelTime,

        trafficRatio: observation.trafficRatio,

        source: "tomtom",

        observedAt: new Date(),
      }));

      if (samples.length) {
        await CrowdSample.insertMany(samples);

        savedSamples += samples.length;
      }

      updatedZones++;

      console.log(
        `UPDATED: ${zone.zoneId} → ` +
          `${zone.points.length} sample points`
      );
    } catch (error) {
      failedZones++;

      console.error(
        `FAILED: ${zone.zoneId} → ${error.message}`
      );
    }
  }

  console.log(
    `Crowd refresh complete: ` +
      `${updatedZones} zones updated, ` +
      `${failedZones} zones failed, ` +
      `${savedSamples} CrowdSample records saved`
  );

  console.log(
    `TomTom requests used: ` +
      `${zonesToRefresh.length}/${requestLimit}`
  );
}
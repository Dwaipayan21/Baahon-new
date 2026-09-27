import Pandal from "../../models/pandal.model.js";
import { collectPandalCrowdObservations } from "./crowdObservation.service.js";

export async function refreshCrowdData() {
  const pandals = await Pandal.find({
    "crowdSamplePoints.0": { $exists: true },
  }).select("_id name");

  console.log(`Refreshing crowd data for ${pandals.length} pandals...`);

  let updated = 0;
  let failed = 0;

  for (const pandal of pandals) {
    try {
      await collectPandalCrowdObservations(pandal._id);

      updated++;
      console.log(`UPDATED: ${pandal.name}`);
    } catch (error) {
      failed++;
      console.error(`FAILED: ${pandal.name} → ${error.message}`);
    }
  }

  console.log(
    `Crowd refresh complete: ${updated} updated, ${failed} failed`
  );
}
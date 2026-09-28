import Pandal from "../../models/pandal.model.js";
import { collectPandalCrowdObservations } from "./crowdObservation.service.js";
import { getPandalCrowdStatus } from "./crowdAggregation.service.js";

export async function refreshPandalCrowd(pandalId) {
  const pandal = await Pandal.findById(pandalId);

  if (!pandal) {
    throw new Error("Pandal not found");
  }

  await collectPandalCrowdObservations(pandalId);

  const updatedPandal = await Pandal.findById(pandalId).select(
    "_id name crowdSamplePoints"
  );

  const crowd = await getPandalCrowdStatus(updatedPandal);

  return {
    pandalId: pandal._id,
    pandalName: pandal.name,
    ...crowd,
  };
}
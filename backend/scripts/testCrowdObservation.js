import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import Pandal from "../models/pandal.model.js";
import { collectPandalCrowdObservations } from "../services/crowd/crowdObservation.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const pandal = await Pandal.findOne({
      name: "Bagbazar Sarbojanin",
    }).select("_id name");

    if (!pandal) {
      throw new Error("Bagbazar Sarbojanin not found");
    }

    console.log(`Testing: ${pandal.name}`);

    const observations =
      await collectPandalCrowdObservations(pandal._id);

    console.log(`Saved observations: ${observations.length}`);

    observations.forEach((observation) => {
      console.log({
        samplePoint: observation.samplePointName,
        level: observation.congestionLevel,
        score: observation.congestionScore,
        ratio: observation.trafficRatio,
      });
    });
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

test();
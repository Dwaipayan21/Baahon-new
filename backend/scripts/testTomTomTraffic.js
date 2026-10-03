import dotenv from "dotenv";
import mongoose from "mongoose";
import Pandal from "../models/pandal.model.js";
import { getTrafficObservation } from "../services/crowd/tomtomTraffic.service.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function test() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    const pandal = await Pandal.findOne({
      crowdSamplePoints: { $exists: true, $ne: [] }
    }).lean();

    if (!pandal) {
      throw new Error("No pandal with crowd sample points found");
    }

    const samplePoint = pandal.crowdSamplePoints[0];
    const [longitude, latitude] = samplePoint.location.coordinates;

    console.log("\nPandal:", pandal.name);
    console.log("Sample point:", samplePoint.name);
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);

    const result = await getTrafficObservation(latitude, longitude);

    console.log("\nTomTom observation:");
    console.log(JSON.stringify(result, null, 2));

    console.log("\nTomTom service test successful");
  } catch (error) {
    console.error("\nTest failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

test();
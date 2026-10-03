import mongoose from "mongoose";
import dotenv from "dotenv";
import Pandal from "../models/pandal.model.js";
import { getTrafficObservation } from "../services/crowd/tomtomTraffic.service.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const pandal = await Pandal.findOne({
      name: "Bagbazar Sarbojanin",
    }).select("name crowdSamplePoints");

    if (!pandal) {
      throw new Error("Pandal not found");
    }

    const samplePoint = pandal.crowdSamplePoints.find(
      (point) => point.enabled !== false
    );

    if (!samplePoint) {
      throw new Error("No enabled sample point found");
    }

    const [longitude, latitude] = samplePoint.location.coordinates;

    console.log("Testing cache with:");
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);

    console.log("\nFirst request:");
    const first = await getTrafficObservation(latitude, longitude);
    console.log(first);

    console.log("\nSecond request:");
    const second = await getTrafficObservation(latitude, longitude);
    console.log(second);

    console.log("\nTomTom cache test completed successfully");
  } catch (error) {
    console.error("TomTom cache test failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

run();
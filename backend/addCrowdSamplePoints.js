import mongoose from "mongoose";
import dotenv from "dotenv";
import Pandal from "./models/pandal.model.js";

dotenv.config();

async function addCrowdSamplePoints() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const result = await Pandal.updateMany(
      {
        "crowdSamplePoints.0": { $exists: false },
        "location.coordinates": { $exists: true },
      },
      [
        {
          $set: {
            crowdSamplePoints: [
              {
                samplePointId: {
                  $concat: ["pandal-", { $toString: "$_id" }],
                },
                name: "Main Crowd Point",
                location: {
                  type: "Point",
                  coordinates: "$location.coordinates",
                },
                weight: 1,
                enabled: true,
                source: "Pandal Location",
                highway: "",
                distanceMeters: 0,
              },
            ],
          },
        },
      ],
      {
        updatePipeline: true,
      }
    );

    console.log("Matched:", result.matchedCount);
    console.log("Modified:", result.modifiedCount);

    const count = await Pandal.countDocuments({
      "crowdSamplePoints.0": { $exists: true },
    });

    console.log(
      "Pandals with crowd sample points:",
      count
    );

    await mongoose.disconnect();

    console.log("Migration completed");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

addCrowdSamplePoints();
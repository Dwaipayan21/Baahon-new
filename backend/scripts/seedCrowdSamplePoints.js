import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import Pandal from "../models/pandal.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const SAMPLE_POINTS_FILE = path.resolve(
  __dirname,
  "../data/crowdSamplePoints.generated.json"
);

function createSamplePointId(pandalName, pointName, coordinates) {
  const slug = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const pandalSlug = slug(pandalName);
  const pointSlug = slug(pointName);

  // Coordinates make the ID stable even when two roads have the same name.
  const coordinatePart = coordinates
    .map((value) => Number(value).toFixed(6))
    .join("-")
    .replace(/-/g, "_");

  return `${pandalSlug}-${pointSlug}-${coordinatePart}`;
}

async function loadGeneratedPoints() {
  const raw = await fs.readFile(SAMPLE_POINTS_FILE, "utf8");
  return JSON.parse(raw);
}

async function seedCrowdSamplePoints() {
  try {
    const generatedPoints = await loadGeneratedPoints();

    console.log(
      `Loaded sample-point configuration for ${
        Object.keys(generatedPoints).length
      } pandals`
    );

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const pandals = await Pandal.find({});

    console.log(`Found ${pandals.length} pandals in MongoDB\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let totalPoints = 0;

    for (const pandal of pandals) {
      const points = generatedPoints[pandal.name];

      if (!points) {
        console.log(`SKIPPED: ${pandal.name} - no generated points found`);
        skippedCount++;
        continue;
      }

      const samplePoints = points.map((point) => {
        const coordinates = point.location.coordinates;

        return {
          samplePointId: createSamplePointId(
            pandal.name,
            point.name,
            coordinates
          ),

          name: point.name,

          location: {
            type: "Point",
            coordinates,
          },

          weight:
            Number.isFinite(Number(point.weight))
              ? Number(point.weight)
              : 1,

          enabled: point.enabled !== false,

          source: point.source || "OpenStreetMap/Overpass",

          highway: point.highway || "",

          distanceMeters:
            Number.isFinite(Number(point.distanceMeters))
              ? Number(point.distanceMeters)
              : null,
        };
      });

      pandal.crowdSamplePoints = samplePoints;

      await pandal.save();

      updatedCount++;
      totalPoints += samplePoints.length;

      console.log(
        `UPDATED: ${pandal.name} → ${samplePoints.length} sample points`
      );
    }

    console.log("\n--------------------------------");
    console.log("Crowd sample-point seeding complete");
    console.log("--------------------------------");
    console.log(`Pandals updated : ${updatedCount}`);
    console.log(`Pandals skipped : ${skippedCount}`);
    console.log(`Sample points   : ${totalPoints}`);
  } catch (error) {
    console.error("\nSeeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

seedCrowdSamplePoints();
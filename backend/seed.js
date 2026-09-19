import "dotenv/config";
import mongoose from "mongoose";
import Pandal from "./models/pandal.model.js";
import rawPandals from "./data/pandals.json" with { type: "json" };

const formatPandal = ({
  ["location/type"]: type,
  ["location/coordinates/0"]: longitude,
  ["location/coordinates/1"]: latitude,
  verified,
  ...pandal
}) => {
  if (
    type !== "Point" ||
    longitude == null ||
    latitude == null ||
    String(longitude).trim() === "" ||
    String(latitude).trim() === ""
  ) {
    throw new Error(`Invalid coordinates for "${pandal.name}"`);
  }

  const coordinates = [Number(longitude), Number(latitude)];

  if (
    !Number.isFinite(coordinates[0]) ||
    !Number.isFinite(coordinates[1]) ||
    coordinates[0] < -180 ||
    coordinates[0] > 180 ||
    coordinates[1] < -90 ||
    coordinates[1] > 90
  ) {
    throw new Error(
      `Invalid GeoJSON coordinates for "${pandal.name}": [${coordinates.join(", ")}]`
    );
  }

  return {
    ...pandal,
    verified: String(verified).trim().toLowerCase() === "true",
    location: {
      type: "Point",
      coordinates,
    },
  };
};

const seedDatabase = async () => {
  try {
    const pandals = rawPandals.map(formatPandal);

    console.log(`Valid pandals: ${pandals.length}/${rawPandals.length}`);

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    await Pandal.deleteMany({});
    await Pandal.insertMany(pandals);

    console.log(`${pandals.length} pandals inserted successfully`);
  } catch (error) {
    console.error("Seeding failed:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
};

seedDatabase();
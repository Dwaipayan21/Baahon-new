require("dotenv").config();

const mongoose = require("mongoose");
const Pandal = require("./models/pandal.model.js");
const rawPandals = require("./data/pandals.json");

const formatPandal = ({
  ["location/type"]: type,
  ["location/coordinates/0"]: longitude,
  ["location/coordinates/1"]: latitude,
  verified,
  ...pandal
}) => ({
  ...pandal,
  verified: String(verified).trim().toLowerCase() === "true",
  location: {
    type,
    coordinates: [Number(longitude), Number(latitude)],
  },
});

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
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import Pandal from "../models/pandal.model.js";
import { refreshPandalCrowd } from "../services/crowd/crowdEngine.service.js";

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
      throw new Error("Pandal not found");
    }

    const result = await refreshPandalCrowd(pandal._id);

    console.log("\nCrowd result:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

test();
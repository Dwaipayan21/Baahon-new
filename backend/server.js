import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import pandalRoutes from "./routes/pandal.route.js";
import pathRoutes from "./routes/path.route.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/pandals", pandalRoutes);
app.use("/api/path", pathRoutes);

app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });
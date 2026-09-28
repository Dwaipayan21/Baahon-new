import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import pandalRoutes from "./routes/pandal.route.js";
import foodRoutes from "./routes/food.routes.js";
import pathRoutes from "./routes/path.route.js";
import checkInRoutes from "./routes/checkin.route.js";
import errorHandler from "./middleware/errorHandler.js";

import { startCrowdScheduler } from "./services/crowd/crowdScheduler.service.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(clerkMiddleware());
app.use(cors());
app.use(express.json());

// Routes
// Food routes should be mounted before generic pandal routes
app.use("/api/pandals", foodRoutes);
app.use("/api/pandals", pandalRoutes);

app.use("/api/path", pathRoutes);
app.use("/api/checkins",checkInRoutes);

// Centralized error handler
app.use(errorHandler);

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    // Start crowd scheduler after database connection
    startCrowdScheduler();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });

export default app;
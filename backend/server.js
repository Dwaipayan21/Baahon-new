import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import pandalRoutes from "./routes/pandal.route.js";
import foodRoutes from "./routes/food.routes.js";
import pathRoutes from "./routes/path.route.js";
import checkInRoutes from "./routes/checkin.route.js";
import userRoutes from "./routes/user.route.js";
import scoreboardRoutes from "./routes/scoreboard.route.js";
import errorHandler from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";

import { startCrowdScheduler } from "./services/crowd/crowdScheduler.service.js";
import { printTomTomUsageSummary } from "./services/crowd/tomtomUsage.service.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(clerkMiddleware());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// API Routes
app.use("/api/pandals", foodRoutes);
app.use("/api/pandals", pandalRoutes);
app.use("/api/path", pathRoutes);
app.use("/api/checkins", checkInRoutes);
app.use("/api/users", userRoutes);
app.use("/api/scoreboard", scoreboardRoutes);

// 404 - Route not found
app.use(notFound);

// Global error handler
app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    startCrowdScheduler();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      printTomTomUsageSummary();
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });

export default app;
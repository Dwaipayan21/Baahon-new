
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
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

// ES module directory configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header (e.g. server-to-server).
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// Clerk authentication middleware
app.use(clerkMiddleware());

// API Routes
app.use("/api/pandals", foodRoutes);
app.use("/api/pandals", pandalRoutes);
app.use("/api/path", pathRoutes);
app.use("/api/checkins", checkInRoutes);
app.use("/api/users", userRoutes);
app.use("/api/scoreboard", scoreboardRoutes);

// Frontend deployment
if (process.env.NODE_ENV === "production") {
  const frontendDistPath = path.resolve(
    __dirname,
    "../frontend/dist"
  );

  app.use(express.static(frontendDistPath));

  // Serve React for frontend routes, not unknown API routes.
  app.get(/^(?!\/api(?:\/|$)).*/, (req, res, next) => {
    res.sendFile(
      path.join(frontendDistPath, "index.html"),
      (error) => {
        if (error) next(error);
      }
    );
  });
}

// 404 - Route not found
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Database connection and server startup
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
    console.error(
      "MongoDB connection error:",
      error.message
    );
    process.exit(1);
  });

export default app;

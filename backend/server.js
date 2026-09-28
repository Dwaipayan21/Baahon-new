import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Pandal = require("./models/pandal.model.js");
const errorHandler = require("./middleware/errorHandler.js");
const foodRoutes = require("./routes/food.routes.js");
import pandalRoutes from "./routes/pandal.route.js";
import pathRoutes from "./routes/path.route.js";
import checkInRoutes from "./routes/checkin.route.js";
import errorHandler from "./middleware/errorHandler.js";
import { startCrowdScheduler } from "./services/crowd/crowdScheduler.service.js"

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/pandals", pandalRoutes);
app.use("/api/path", pathRoutes);
app.use("/api/checkin", checkInRoutes);

app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

// Food routes (mounted before generic /:id route)
app.use("/api/pandals", foodRoutes);

// GET all pandals
app.get("/api/pandals", async (req, res, next) => {
  try {
    const pandals = await Pandal.find();
    startCrowdScheduler();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    next(error);
  }
});

// GET one pandal by ID
app.get("/api/pandals/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("Invalid pandal ID");
      error.statusCode = 400;
      throw error;
    }

    const pandal = await Pandal.findById(id);

    if (!pandal) {
      const error = new Error("Pandal not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: pandal,
    });
  } catch (error) {
    next(error);
  }
});

// Centralized error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });

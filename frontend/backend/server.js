
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Pandal = require("./models/pandal.model.js");
const errorHandler = require("./middleware/errorHandler.js");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

// GET all pandals
app.get("/api/pandals", async (req, res, next) => {
  try {
    const pandals = await Pandal.find();

    res.status(200).json({
      success: true,
      count: pandals.length,
      data: pandals,
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
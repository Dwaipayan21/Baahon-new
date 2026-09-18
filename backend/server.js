import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import {
  getAllPandals,
  getPandalById,
} from "./controllers/pandal.controller.js";

import errorHandler from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/api/pandals", getAllPandals);
app.get("/api/pandals/:id", getPandalById);

// Centralized error handler
app.use(errorHandler);

// MongoDB connection and server start
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
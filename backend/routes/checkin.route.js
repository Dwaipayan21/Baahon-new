import express from "express";

import {
  createCheckIn,
  getPandalCheckInCount,
  getUserCheckIns,
} from "../controllers/checkin.controller.js";

import requireAuth from "../middleware/auth.middleware.js";

const router = express.Router();

// Authentication required to create a check-in
router.post("/", requireAuth, createCheckIn);

// Public - anyone can see the check-in count for a pandal
router.get("/pandal/:pandalId/count", getPandalCheckInCount);

// Get all check-ins for a user
router.get("/user/:userId", getUserCheckIns);

export default router;
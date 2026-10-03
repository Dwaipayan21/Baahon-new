import express from "express";
import {
  createCheckIn,
  getPandalCheckInCount,
  getUserCheckIns,
  getLeaderboard,
} from "../controllers/checkin.controller.js";
import requireAuth from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", requireAuth, createCheckIn);

router.get("/pandal/:pandalId/count", getPandalCheckInCount);

router.get("/me", requireAuth, getUserCheckIns);

router.get("/leaderboard", getLeaderboard);

export default router;
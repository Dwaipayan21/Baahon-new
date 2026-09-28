
import express from "express";

import {
  createCheckIn,
  getPandalCheckInCount,
  getUserCheckIns,
} from "../controllers/checkin.controller.js";

const router = express.Router();

router.post("/", createCheckIn);

router.get(
  "/pandal/:pandalId/count",
  getPandalCheckInCount
);

router.get(
  "/user/:userId",
  getUserCheckIns
);

export default router;


import express from "express";
import { createCheckIn, getPandalCheckInCount } from "../controllers/checkin.controller.js";

const router = express.Router();

router.post("/", createCheckIn);
router.get("/pandal/:pandalId/count", getPandalCheckInCount);

export default router;
import express from "express";
import { getScoreboard } from "../controllers/scoreboard.controller.js";

const router = express.Router();

router.get("/", getScoreboard);

export default router;
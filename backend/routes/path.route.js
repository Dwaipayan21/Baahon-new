import express from "express";
import { getNextPandalRoute, getRoutePath } from "../controllers/route.controller.js";

const router = express.Router();

router.get("/", getRoutePath);

router.post("/next",getNextPandalRoute);

export default router;
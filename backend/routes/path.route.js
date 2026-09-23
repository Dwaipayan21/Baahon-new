import express from "express";
import { getRoute } from "../controllers/route.controller.js";

const router = express.Router();

router.get("/", getRoute);

export default router;
import express from "express";
import { getRoutePath } from "../controllers/route.controller.js";

const router = express.Router();

router.get("/", getRoutePath);

export default router;
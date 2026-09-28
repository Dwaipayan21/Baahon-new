import express from "express";
import { getFoodForPandal } from "../controllers/food.controller.js";

const router = express.Router();

router.get("/:pandalId/food", getFoodForPandal);

export default router;
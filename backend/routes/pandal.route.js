import express from "express";
import { createPandal, getAllPandals, getNearbyPandals, getPandalById, getPandalCrowd, updatePandal } from "../controllers/pandal.controller.js";


const router = express.Router();

router.get("/",getAllPandals);
router.get("/nearby", getNearbyPandals);
router.post("/", createPandal);
router.put("/:id", updatePandal);
router.get("/:id/crowd", getPandalCrowd);
router.get("/:id",getPandalById);

export default router;
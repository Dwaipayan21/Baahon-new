import express from "express";
import { getAllPandals, getPandalById } from "../controllers/pandal.controller.js";


const router = express.Router();

router.get("/",getAllPandals);
router.get("/:id",getPandalById);

export default router;
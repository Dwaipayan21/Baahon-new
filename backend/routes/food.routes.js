/**
 * Food Routes (Backend)
 * 
 * Exposes food discovery endpoint for pandals.
 * Route: GET /:pandalId/food (mounted under /api/pandals)
 */

const express = require("express");
const { getFoodForPandal } = require("../controllers/food.controller.js");

const router = express.Router();

// GET /api/pandals/:pandalId/food
router.get("/:pandalId/food", getFoodForPandal);

module.exports = router;

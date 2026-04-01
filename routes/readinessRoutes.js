const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const readinessController = require("../controllers/readinessController");

// calculate readiness
router.get("/analyze", authMiddleware, readinessController.calculateReadiness);

// history
router.get("/history", authMiddleware, readinessController.getReadinessHistory);

module.exports = router;
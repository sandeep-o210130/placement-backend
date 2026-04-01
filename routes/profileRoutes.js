const express = require("express");
const router = express.Router();

const profileController = require("../controllers/profileController");
const upload = require("../middleware/uploadResume");
const authMiddleware = require("../middleware/authMiddleware");


// create profile
router.post("/create", authMiddleware, profileController.createProfile);

// get profile
router.get("/me", authMiddleware, profileController.getProfile);

// update profile
router.put("/update", authMiddleware, profileController.updateProfile);

// upload resume
router.post(
  "/upload-resume",
  authMiddleware,
  upload.single("resume"),
  profileController.uploadResume
);

module.exports = router;
const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// REGISTER
router.post("/register", authController.register);

// LOGIN
router.post("/login", authController.login);

// FORGOT PASSWORD
router.post("/forgot-password", authController.forgotPassword);

// VERIFY OTP
router.post("/verify-otp", authController.verifyOTP);

// RESET PASSWORD
router.post("/reset-password", authController.resetPassword);

module.exports = router;
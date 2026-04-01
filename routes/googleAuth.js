const express = require("express");
const router = express.Router();
const passport = require("passport");
const transporter = require("../config/email");

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account"
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login"
  }),

  async (req, res) => {

    const name = req.user.name;
    const email = req.user.email;

    // Send password email ONLY for new Google users
    if (req.user.generatedPassword) {

      const password = req.user.generatedPassword;

      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your Placement AI Login Credentials",

        html: `
        <div style="font-family:Arial;padding:20px">

        <h2>Welcome ${name}</h2>

        <p>Your account was created using Google login.</p>

        <p><b>Email:</b> ${email}</p>
        <p><b>Password:</b> ${password}</p>

        <p>You can login using this password anytime.</p>

        <p>Please change the password after login for better security.</p>

        <p>You can now:</p>
          <ul>
            <li>Upload your academic profile</li>
            <li>Track placement readiness</li>
            <li>Monitor your progress over time</li>
          </ul>

          <p>We wish you success in your placement journey.</p>

        <hr>

        <p style="font-size:12px;color:gray">
        Placement AI System
        </p>

        </div>
        `
      });

    }

    const encodedName = encodeURIComponent(name);
    const encodedEmail = encodeURIComponent(email);

    res.redirect(
      `http://localhost:5173/dashboard?name=${encodedName}&email=${encodedEmail}`
    );

  }
);

module.exports = router;
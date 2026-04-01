const User = require("../models/User");
const bcrypt = require("bcrypt");
const OTP = require("../models/OTP");
const transporter = require("../config/email");
const jwt = require("jsonwebtoken");

const validatePassword = (password) => {
  const regex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
  return regex.test(password);
};

exports.register = async (req, res) => {

  try {

    const { name, username, email, password } = req.body;

    if (!validatePassword(password)) {
      return res.status(400).json({
        message:
        "Password must contain uppercase, number and special character"
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists (Username and Email Should Be Unique)"
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = new User({
      name,
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    // welcome email
    transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Welcome to Placement AI System",
        html: `
        <div style="font-family:Arial;padding:20px">
          <h2>Welcome ${name}</h2>

          <p>Your account has been successfully created.</p>

          <p>You can now:</p>
          <ul>
            <li>Upload your academic profile</li>
            <li>Track placement readiness</li>
            <li>Monitor your progress over time</li>
          </ul>

          <p>We wish you success in your placement journey.</p>

          <hr/>

          <p style="font-size:12px;color:gray">
          Placement AI System
          </p>

        </div>
        `
});

    res.status(201).json({
      message: "User registered successfully"
    });

  } catch (error) {

    console.log("Register error:",error);

    res.status(500).json({
      message: error.message
    });

  }
};


exports.login = async (req, res) => {

  try {

    const { loginId, password } = req.body;

    const user = await User.findOne({
      $or: [
        { email: loginId },
        { username: loginId }
      ]
    });

    if (!user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    const isMatch =
      await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};


exports.forgotPassword = async (req, res) => {

  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp,
      expiresAt
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      html: `
      <div style="font-family:Arial;padding:20px;text-align:center">

      <h2>Password Reset Request</h2>

      <p>Your OTP code is</p>

      <h1 style="letter-spacing:5px">${otp}</h1>

      <p>This OTP is valid for <b>5 minutes</b>.</p>

      <p>If you did not request this, please ignore this email.</p>

      <hr/>

      <p style="font-size:12px;color:gray">
          Placement AI System
      </p>
      
      </div>
      `
});

    res.json({
      message: "OTP sent to email"
    });

  } 

  catch (error) {

  console.log("Forgot Password Error:", error);

  res.status(500).json({
    message: error.message
  });

}

};


exports.verifyOTP = async (req, res) => {

  try {

    const { email, otp } = req.body;

    const record = await OTP.findOne({ email });

    if (!record) {
      return res.status(400).json({
        message: "OTP not found"
      });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({
        message: "OTP expired"
      });
    }

    if (record.otp !== otp) {

      record.attempts += 1;
      await record.save();

      return res.status(400).json({
        message: "Invalid OTP"
      });

    }

    res.json({
      message: "OTP verified"
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};


exports.resetPassword = async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!validatePassword(password)) {
      return res.status(400).json({
        message: "Password must contain uppercase, number and special character"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.updateOne(
      { email },
      { password: hashedPassword }
    );

    await OTP.deleteMany({ email });

    res.json({
      message: "Password reset successful"
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};
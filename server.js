require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const session = require("express-session");
const passport = require("passport");

require("./config/passport");

const profileRoutes = require("./routes/profileRoutes.js");
const authRoutes = require("./routes/authRoutes");
const readinessRoutes = require("./routes/readinessRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();   // ✅ CREATE APP FIRST


// ---------------- MIDDLEWARE ----------------

app.use(cors());
app.use(express.json());

app.use(
  session({
    secret: "placement-ai-secret",
    resave: false,
    saveUninitialized: true
  })
);

app.use(passport.initialize());
app.use(passport.session());


// ---------------- ROUTES ----------------

// Test route
app.get("/", (req, res) => {
  res.send("Placement Readiness API Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/readiness", readinessRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Google login route
app.use("/auth", require("./routes/googleAuth"));


// ---------------- DATABASE ----------------

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
.then(() => {

  console.log("MongoDB Connected");

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

})
.catch(err => console.log(err));
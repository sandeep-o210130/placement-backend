const Profile = require("../models/Profile");
const Readiness = require("../models/readinessModel");
const transporter = require("../config/email");
const User = require("../models/User");
const axios = require("axios");


exports.calculateReadiness = async (req, res) => {
  try {

    const profile = await Profile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const cgpa = profile.cgpa || 0;
    const dsa = profile.dsaScore || 0;
    const aptitude = profile.aptitudeLevel || 0;
    const communication = profile.communicationLevel || 0;
    const projects = profile.projects?.length || 0;
    const certificates = profile.certificates?.length || 0;

    let score = 0;
    let status = "Not Ready";

    
    const projectsArr = profile.projects || [];
    const certsArr = profile.certificates || [];
    const techArr = profile.technologies || [];

    
    try {
      const mlResponse = await axios.post("https://sandeep130-placement-ml-api.hf.space/ml/evaluate", {
        cgpa,
        dsa_score: dsa,
        aptitude,
        communication,
        projects: projectsArr,
        certificates: certsArr,
        technologies: techArr
      });

      const mlData = mlResponse.data;
      
      score = mlData.score || 0;
      status = mlData.status || "Not Ready";

      
      req.mlSuggestions = mlData.suggestions || [];
      req.mlFeatureImportance = mlData.feature_importance || {};
      req.mlConfidence = mlData.confidence || 0.0;
      
    } catch (err) {
      
      console.error(
        "ML Parsing failed FULL:",
        err.response?.data || err.message
      );

      
      score += (cgpa / 10) * 10;
      score += (dsa / 100) * 25;
      score += (aptitude / 5) * 5;
      score += (communication / 5) * 5;
      score += projectsArr.length >= 2 ? 25 : 5;
      score += certsArr.length >= 1 ? 10 : 2;
      score += techArr.length >= 3 ? 20 : 5;
      
      score = Math.round(score);
      if (score >= 80) status = "Ready";
      else if (score >= 60) status = "Almost Ready";
      
      req.mlSuggestions = [];
    }

    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Readiness.findOneAndUpdate(
      { userId: req.user.id, createdAt: { $gte: today } },
      { readinessScore: score, status },
      { upsert: true, returnDocument: 'after' }
    );

    const user = await User.findById(req.user.id);

    if (user) {
      const getColor = (score) => {
          if (score <= 60) return "#ff4d4f";
          if (score <= 75) return "#faad14";
          return "#52c41a";
        };

      const color = getColor(score);

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Placement Readiness Report",
        html: `
          <div style="font-family:Arial;padding:20px">

            <h2>Placement Readiness Report</h2>

            <p>Your current score:</p>

            <h1 style="color:${color};margin:10px 0;">
              ${score}%
            </h1>

            <p>
              Status: 
              <b style="color:${color}">
                ${status}
              </b>
            </p>

            <hr/>

            <p style="font-size:12px;color:gray">
              Placement AI System
            </p>

          </div>
        `
      });
    }

    res.json({ readinessScore: score, status });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};


// HISTORY
exports.getReadinessHistory = async (req, res) => {
  try {

    const history = await Readiness
      .find({ userId: req.user.id })
      .sort({ createdAt: 1 });

    res.json(history);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
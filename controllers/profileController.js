const Profile = require("../models/Profile");
const Readiness = require("../models/readinessModel");
const User = require("../models/User");
const transporter = require("../config/email");
const axios = require("axios");


const calculateScore = async (profile) => {

  const cgpa = profile.cgpa || 0;
  const dsa = profile.dsaScore || 0;
  const aptitude = profile.aptitudeLevel || 0;
  const communication = profile.communicationLevel || 0;
  const projectsArr = profile.projects || [];
  const certsArr = profile.certificates || [];
  const techArr = profile.technologies || [];

  let score = 0;
  let status = "Not Ready";

  try {
    const mlResponse = await axios.post("https://placement-ml-api-s9nj.onrender.com/ml/evaluate", {
      cgpa,
      dsa_score: dsa,
      aptitude,
      communication,
      projects: projectsArr,
      certificates: certsArr,
      technologies: techArr
    });

    score = mlResponse.data.score || 0;
    status = mlResponse.data.status || "Not Ready";
  } catch (err) {
    console.log("ML service error in profile:", err.message);
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
  }

  return { score, status };
};


exports.createProfile = async (req, res) => {
  try {

    const userId = req.user.id;

   
    const profile = await Profile.findOneAndUpdate(
      { userId },
      { ...req.body },
      { returnDocument: 'after', upsert: true }
    );

   
    const { score, status } = await calculateScore(profile);

    
    const readiness = new Readiness({
      userId,
      readinessScore: score,
      status
    });

    await readiness.save();

   
    const user = await User.findById(userId);

    if (user && user.email) {
      try {
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
      } catch (err) {
        console.log("Email failed:", err.message);
      }
    }

    res.json({
      message: "Profile saved successfully",
      profile
    });

  } catch (error) {

    console.log("CREATE PROFILE ERROR:", error.message);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }
};


exports.getProfile = async (req, res) => {
  try {

    const profile = await Profile.findOne({
      userId: req.user.id
    });

    res.json(profile);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.updateProfile = async (req, res) => {
  try {

    const userId = req.user.id;

    const profile = await Profile.findOneAndUpdate(
      { userId },
      req.body,
      { returnDocument: 'after', upsert: true }
    );

    const { score, status } = await calculateScore(profile);

    
    const readiness = new Readiness({
      userId,
      readinessScore: score,
      status
    });

    await readiness.save();

    res.json({
      message: "Profile updated",
      profile
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const base64Content = req.file.buffer.toString("base64");

    
    let parsedData = {
      projects: [],
      certificates: [],
      technologies: [],
      cgpa: 0
    };

    try {
      const mlResponse = await axios.post("https://placement-ml-api-s9nj.onrender.com/ml/parse-resume", {
        file_content: base64Content
      });
      parsedData = mlResponse.data;
    } catch (mlErr) {
        console.error(
        "ML Parsing failed FULL:",
        mlErr.response?.data || mlErr.message
      );
  }
      
  
    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      {
        resumeUrl: resumePath,
        projects: parsedData.projects.length > 0 ? parsedData.projects : undefined,
        technologies: parsedData.technologies.length > 0 ? parsedData.technologies : undefined,
        certificates: parsedData.certificates.length > 0 ? parsedData.certificates : undefined,
        cgpa: parsedData.cgpa > 0 ? parsedData.cgpa : undefined
      },
      { returnDocument: 'after' }
    );

    res.json({
      message: "Resume uploaded and profile auto-filled!",
      extractedData: parsedData,
      profile
    });

  } catch (error) {
    console.log("RESUME UPLOAD ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};
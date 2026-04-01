const Profile = require("../models/Profile");
const Readiness = require("../models/readinessModel");

exports.getDashboard = async (req, res) => {

  try {

    const userId = req.user.id;

    const profile = await Profile.findOne({ userId });

    const latestReadiness = await Readiness
      .findOne({ userId })
      .sort({ createdAt: -1 });

    const history = await Readiness
      .find({ userId })
      .sort({ createdAt: 1 });

    res.json({

      profile:{
        cgpa: profile?.cgpa || 0,
        dsaScore: profile?.dsaScore || 0,
        aptitudeLevel: profile?.aptitudeLevel || 0,
        communicationLevel: profile?.communicationLevel || 0,
        projects: profile?.projects?.length || 0,
        certificates: profile?.certificates?.length || 0
      },

      readiness:{
        score: latestReadiness?.readinessScore || 0,
        status: latestReadiness?.status || "Not analyzed"
      },

      history: history.map(h => ({
        readinessScore: h.readinessScore,
        createdAt: h.createdAt
      }))

    });

  }
  catch(err){

    console.log("Dashboard error:",err);

    res.status(500).json({
      error: err.message
    });

  }

};
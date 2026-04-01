const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  cgpa: Number,
  dsaScore: Number,
  aptitudeLevel: Number,
  communicationLevel: Number,

  projects: [String],
  certificates: [String],
  technologies: [String],

  resumeUrl: String

}, { timestamps: true });

module.exports = mongoose.model("Profile", profileSchema);
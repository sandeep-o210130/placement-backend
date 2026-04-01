const mongoose = require("mongoose");

const readinessSchema = new mongoose.Schema({

  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },

  readinessScore:{
    type:Number,
    required:true
  },

  status:{
    type:String,
    enum:["Needs Improvement","Almost Ready","Placement Ready"],
    required:true
  }

},{
  timestamps:true
});

module.exports = mongoose.model("Readiness",readinessSchema);
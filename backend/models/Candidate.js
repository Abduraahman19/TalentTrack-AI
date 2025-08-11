const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  skills: [String],
  experience: [{
    jobTitle: String,
    company: String,
    duration: String,
    description: String
  }],
  education: [{
    degree: String,
    institution: String,
    year: String
  }],
  resumePath: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  roleMatchScores: [{
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobDescription' },
    score: Number,
    explanation: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);
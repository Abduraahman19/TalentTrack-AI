const mongoose = require('mongoose');

const jobDescriptionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  requiredSkills: [String],
  preferredSkills: [String],
  minExperience: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('JobDescription', jobDescriptionSchema);
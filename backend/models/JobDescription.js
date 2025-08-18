const mongoose = require('mongoose');

const jobDescriptionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  requiredSkills: {
    type: [String],
    required: true
  },
  preferredSkills: [String],
  minExperience: {
    type: Number,
    default: 0
  },
  salaryRange: {
    min: Number,
    max: Number
  },
  location: String,
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    default: 'Full-time'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better search performance
jobDescriptionSchema.index({ title: 'text', description: 'text', requiredSkills: 'text' });

// Virtual for candidates count
jobDescriptionSchema.virtual('candidatesCount', {
  ref: 'Candidate',
  localField: '_id',
  foreignField: 'roleMatchScores.roleId',
  count: true
});

module.exports = mongoose.model('JobDescription', jobDescriptionSchema);

// Add this to your JobDescription model (jobDescription.js)
jobDescriptionSchema.post('remove', async function (doc) {
  try {
    await mongoose.model('Candidate').updateMany(
      { 'roleMatchScores.roleId': doc._id },
      { $pull: { roleMatchScores: { roleId: doc._id } } }
    );
    console.log(`Cleaned up role matches for deleted job ${doc._id}`);
  } catch (err) {
    console.error('Error cleaning up role matches:', err);
  }
});
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
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
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

// Add company index
jobDescriptionSchema.index({ company: 1 });
// Index for better search performance
jobDescriptionSchema.index({ title: 'text', description: 'text', requiredSkills: 'text' });
jobDescriptionSchema.index({ company: 1 }); // Add company index

// Virtual for candidates count
jobDescriptionSchema.virtual('candidatesCount', {
  ref: 'Candidate',
  localField: '_id',
  foreignField: 'roleMatchScores.roleId',
  count: true
});

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

module.exports = mongoose.model('JobDescription', jobDescriptionSchema);
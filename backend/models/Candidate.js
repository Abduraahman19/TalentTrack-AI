const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'] },
  email: {
    type: String,
    required: [true, 'Email is required'],
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  phone: String,
  skills: { type: [String], default: [] },
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
  resumePath: { type: String, required: true },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  roleMatchScores: [{
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobDescription' },
    score: { type: Number, min: 0, max: 100 },
    explanation: String
  }],
  tags: [{
    name: String,
    color: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  notes: [{
    content: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['new', 'shortlisted', 'interviewed', 'hired', 'rejected'],
    default: 'new'
  }
}, { timestamps: true });

// Define indexes only once (remove any duplicate index definitions)
candidateSchema.index({ company: 1 });
candidateSchema.index({ email: 1 });
candidateSchema.index({ skills: 1 });
candidateSchema.index({ 'roleMatchScores.score': -1 });
candidateSchema.index({ uploadedBy: 1 });
candidateSchema.index({ status: 1 });

// Prevent duplicate resume uploads for the same company
candidateSchema.statics.checkDuplicate = async function (email, company) {
  return this.findOne({ email, company });
};

module.exports = mongoose.model('Candidate', candidateSchema);
const candidateSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'] },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    validate: {
      validator: function(v) {
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
  roleMatchScores: [{
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobDescription' },
    score: { type: Number, min: 0, max: 100 },
    explanation: String
  }]
}, { timestamps: true });

// Add index for better query performance
candidateSchema.index({ email: 1 });
candidateSchema.index({ 'skills': 1 });
candidateSchema.index({ 'roleMatchScores.score': -1 });

module.exports = mongoose.model('Candidate', candidateSchema);
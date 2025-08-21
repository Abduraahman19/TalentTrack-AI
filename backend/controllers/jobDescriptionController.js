// controllers/jobDescriptionController.js - Updated
const JobDescription = require('../models/JobDescription');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const Candidate = require('../models/Candidate');

// Create a new job description
exports.createJobDescription = async (req, res) => {
  try {
    console.log('Request user:', req.user); // Log the user making the request
    console.log('Request body:', req.body); // Log the incoming data

    const { title, description, requiredSkills, preferredSkills, minExperience, salaryRange, location, employmentType } = req.body;

    // Validate required fields
    if (!title || !requiredSkills || requiredSkills.length === 0) {
      console.error('Validation failed - missing required fields');
      return res.status(400).json({
        message: 'Validation failed',
        errors: {
          title: !title ? 'Title is required' : undefined,
          requiredSkills: !requiredSkills || requiredSkills.length === 0
            ? 'At least one required skill is needed'
            : undefined
        }
      });
    }

    // Validate skill arrays
    if (!Array.isArray(requiredSkills) || !Array.isArray(preferredSkills || [])) {
      return res.status(400).json({
        message: 'Skills must be provided as arrays'
      });
    }

    // In createJobDescription function, add company:
    const jobData = {
      title,
      description,
      requiredSkills,
      preferredSkills: preferredSkills || [],
      minExperience: minExperience || 0,
      salaryRange: salaryRange || { min: 0, max: 0 },
      location,
      employmentType: employmentType || 'Full-time',
      createdBy: req.user.id,
      company: req.user.company // Add company from authenticated user
    };

    console.log('Creating job with data:', jobData);

    const jobDescription = await JobDescription.create(jobData);
    console.log('Job created successfully:', jobDescription);

    // Recalculate matches for candidates in the same company
    calculateMatchesForAllCandidates(req.user.company).catch(err => {
      console.error('Error calculating matches:', err);
    });

    return res.status(201).json(jobDescription);

  } catch (err) {
    console.error('Full error stack:', err.stack);
    console.error('Mongoose validation errors:', err.errors);

    if (err.name === 'ValidationError') {
      const errors = {};
      Object.keys(err.errors).forEach(key => {
        errors[key] = err.errors[key].message;
      });
      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }

    return res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Get all job descriptions for the user's company
exports.getJobDescriptions = async (req, res) => {
  try {
    const { search, skill, minExperience, isActive } = req.query;
    const query = { company: req.user.company }; // Filter by company

    if (search) {
      query.$text = { $search: search };
    }

    if (skill) {
      query.requiredSkills = { $in: [new RegExp(skill, 'i')] };
    }

    if (minExperience) {
      query.minExperience = { $gte: parseInt(minExperience) };
    }

    if (isActive) {
      query.isActive = isActive === 'true';
    }

    const jobDescriptions = await JobDescription.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(jobDescriptions);
  } catch (err) {
    console.error('Error fetching job descriptions:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update a job description (with company check)
exports.updateJobDescription = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingJob = await JobDescription.findById(id);
    if (!existingJob) {
      return res.status(404).json({ message: 'Job description not found' });
    }

    // ✅ FIX: convert ObjectId to string before comparing
    if (existingJob.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Access denied. Job does not belong to your company.' });
    }

    const jobDescription = await JobDescription.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    calculateMatchesForAllCandidates(req.user.company).catch(err => {
      console.error('Background match calculation failed:', err);
    });

    res.json(jobDescription);
  } catch (err) {
    console.error('Error updating job description:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a job description (with company check)
exports.deleteJobDescription = async (req, res) => {
  try {
    const { id } = req.params;

    const existingJob = await JobDescription.findById(id);
    if (!existingJob) {
      return res.status(404).json({ message: 'Job description not found' });
    }

    // ✅ FIX here as well
    if (existingJob.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Access denied. Job does not belong to your company.' });
    }

    await JobDescription.findByIdAndDelete(id);

    await Candidate.updateMany(
      { 'roleMatchScores.roleId': id, company: req.user.company },
      { $pull: { roleMatchScores: { roleId: id } } }
    );

    res.json({ message: 'Job description deleted successfully' });
  } catch (err) {
    console.error('Error deleting job description:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// Update the helper function to work with company-specific data
async function calculateMatchesForAllCandidates(company) {
  try {
    console.log('Starting to calculate matches for all candidates in company:', company);

    const jobs = await JobDescription.find({ isActive: true, company });
    const candidates = await Candidate.find({ company });

    console.log(`Processing ${candidates.length} candidates against ${jobs.length} jobs`);

    for (const candidate of candidates) {
      candidate.roleMatchScores = [];

      for (const job of jobs) {
        const score = await calculateMatchScore(candidate.skills, job.requiredSkills);
        const explanation = await generateMatchExplanation(candidate.skills, job.requiredSkills);

        candidate.roleMatchScores.push({
          roleId: job._id,
          score,
          explanation
        });
      }

      await candidate.save();
    }

    console.log('Finished calculating matches for all candidates');
  } catch (err) {
    console.error('Error in calculateMatchesForAllCandidates:', err);
    throw err;
  }
}

// Add these supporting functions if they don't exist
async function calculateMatchScore(candidateSkills, requiredSkills) {
  if (!requiredSkills || requiredSkills.length === 0) return 0;

  const matchedSkills = requiredSkills.filter(skill =>
    candidateSkills.some(candidateSkill =>
      candidateSkill.toLowerCase().includes(skill.toLowerCase())
    )
  );

  return (matchedSkills.length / requiredSkills.length) * 100;
}

async function generateMatchExplanation(candidateSkills, requiredSkills) {
  if (!requiredSkills || requiredSkills.length === 0) {
    return 'No required skills specified for this job';
  }

  const matchedSkills = requiredSkills.filter(skill =>
    candidateSkills.some(candidateSkill =>
      candidateSkill.toLowerCase().includes(skill.toLowerCase())
    )
  );

  const missingSkills = requiredSkills.filter(skill =>
    !matchedSkills.includes(skill)
  );

  if (matchedSkills.length === requiredSkills.length) {
    return 'Perfect match - candidate has all required skills';
  }

  if (matchedSkills.length > 0) {
    return `Candidate has ${matchedSkills.length} of ${requiredSkills.length} required skills (missing: ${missingSkills.join(', ')})`;
  }

  return 'No matching skills found';
}
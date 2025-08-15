const Candidate = require('../models/Candidate');
const JobDescription = require('../models/JobDescription');
const { parsePDF, parseDOCX } = require('../utils/parser');
const { calculateMatchScore, generateMatchExplanation } = require('../utils/skillMatcher');
const fs = require('fs');
const path = require('path');

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let parsedData;
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      
      if (req.file.mimetype === 'application/pdf') {
        parsedData = await parsePDF(fileBuffer);
      } else if (req.file.mimetype.includes('wordprocessingml.document')) {
        parsedData = await parseDOCX(fileBuffer);
      } else {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Unsupported file type' });
      }

      if (!parsedData.name || !parsedData.email) {
        throw new Error('Failed to extract required fields from resume');
      }

      // Check for duplicate resume for this user
      const existingCandidate = await Candidate.checkDuplicate(parsedData.email, req.user.id);
      if (existingCandidate) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          message: 'This candidate has already been uploaded by you',
          candidateId: existingCandidate._id
        });
      }
    } catch (parseError) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        message: 'Error parsing resume',
        error: parseError.message 
      });
    }

    const candidateData = {
      name: parsedData.name || 'Unknown',
      email: parsedData.email || 'no-email@example.com',
      phone: parsedData.phone || '',
      skills: parsedData.skills || [],
      experience: parsedData.experience || [],
      education: parsedData.education || [],
      resumePath: `/uploads/${req.file.filename}`,
      uploadedBy: req.user.id,
      roleMatchScores: []
    };

    // Calculate match scores for all job descriptions
    const jobs = await JobDescription.find();
    for (const job of jobs) {
      const score = await calculateMatchScore(candidateData.skills, job.requiredSkills);
      const explanation = await generateMatchExplanation(candidateData.skills, job.requiredSkills);
      
      candidateData.roleMatchScores.push({
        roleId: job._id,
        score,
        explanation
      });
    }

    const candidate = new Candidate(candidateData);
    await candidate.save();

    return res.status(201).json(candidate);

  } catch (dbError) {
    console.error('Database save error:', dbError);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ 
      message: 'Error saving candidate data',
      error: dbError.message,
      stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
    });
  }
};

exports.getCandidates = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', minScore, status, skill } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Apply role-based filtering
    if (req.user.role === 'recruiter') {
      query.uploadedBy = req.user.id;
    } else if (req.user.role === 'viewer') {
      query.status = { $in: ['shortlisted', 'interviewed'] };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'skills': { $regex: search, $options: 'i' } }
      ];
    }

    if (minScore) {
      query['roleMatchScores.score'] = { $gte: parseInt(minScore) };
    }

    if (status) {
      query.status = status;
    }

    if (skill) {
      query.skills = { $in: [new RegExp(skill, 'i')] };
    }

    const candidates = await Candidate.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'firstName lastName email role')
      .populate('roleMatchScores.roleId', 'title requiredSkills')
      .sort({ createdAt: -1 });

    const total = await Candidate.countDocuments(query);

    res.json({
      data: candidates,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCandidateStatus = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { status } = req.body;

    if (!['new', 'shortlisted', 'interviewed', 'hired', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Check permissions
    if (req.user.role === 'viewer') {
      return res.status(403).json({ message: 'Viewers cannot update candidate status' });
    }

    if (req.user.role === 'recruiter' && candidate.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only update candidates you uploaded' });
    }

    candidate.status = status;
    await candidate.save();

    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addNoteToCandidate = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Note content is required' });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Check permissions
    if (req.user.role === 'viewer') {
      return res.status(403).json({ message: 'Viewers cannot add notes' });
    }

    if (req.user.role === 'recruiter' && candidate.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only add notes to candidates you uploaded' });
    }

    candidate.notes.push({
      content,
      addedBy: req.user.id
    });

    await candidate.save();

    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
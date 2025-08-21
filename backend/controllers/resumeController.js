// controllers/resumeController.js - Updated
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

      // Check for duplicate resume for this company
      const existingCandidate = await Candidate.checkDuplicate(parsedData.email, req.user.company);
      if (existingCandidate) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          message: 'This candidate has already been uploaded in your company',
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
      company: req.user.company, // Add company from authenticated user
      roleMatchScores: []
    };

    // Calculate match scores for all job descriptions in the same company
    const jobs = await JobDescription.find({ company: req.user.company });
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

// Update the getCandidates method to remove recruiter restrictions
exports.getCandidates = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      minScore,
      status,
      skills = '',
      expMin,
      expMax,
      education
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { company: req.user.company }; // Filter by company

    // ONLY apply viewer restrictions, allow admins and recruiters full access
    if (req.user.role === 'viewer') {
      query.status = { $in: ['shortlisted', 'interviewed'] };
    }

    // Text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'skills': { $regex: search, $options: 'i' } }
      ];
    }

    // Skills filter
    if (skills) {
      query.skills = {
        $in: skills.split(',').map(skill => new RegExp(skill, 'i'))
      };
    }

    // Experience range filter
    if (expMin || expMax) {
      query['experience.duration'] = {};
      if (expMin) query['experience.duration'].$gte = parseInt(expMin);
      if (expMax) query['experience.duration'].$lte = parseInt(expMax);
    }

    // Education filter
    if (education) {
      query['education.degree'] = { $regex: new RegExp(education, 'i') };
    }

    // Match score filter
    if (minScore) {
      query['roleMatchScores.score'] = { $gte: parseInt(minScore) };
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    const candidates = await Candidate.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy roleMatchScores.roleId')
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
    console.error('Error fetching candidates:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName email role')
      .populate('roleMatchScores.roleId', 'title requiredSkills');

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Check if candidate belongs to the user's company
    if (candidate.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Access denied. Candidate does not belong to your company.' });
    }

    // ONLY restrict viewers, allow admins and recruiters full access
    if (req.user.role === 'viewer' && !['shortlisted', 'interviewed'].includes(candidate.status)) {
      return res.status(403).json({ message: 'You can only view shortlisted or interviewed candidates' });
    }

    res.json(candidate);
  } catch (err) {
    console.error('Error fetching candidate:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update all other methods to remove recruiter restrictions
exports.addTagToCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    if (!name || !color) {
      return res.status(400).json({ message: 'Tag name and color are required' });
    }

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Check if candidate belongs to the user's company
    if (candidate.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Access denied. Candidate does not belong to your company.' });
    }

    // Only restrict viewers
    if (req.user.role === 'viewer') {
      return res.status(403).json({ message: 'Viewers cannot add tags' });
    }

    candidate.tags.push({
      name,
      color,
      addedBy: req.user.id
    });

    await candidate.save();
    res.json(candidate);
  } catch (err) {
    console.error('Error adding tag:', err);
    res.status(500).json({ error: err.message });
  }
};


// // Remove tag from candidate
// exports.removeTagFromCandidate = async (req, res) => {
//   try {
//     const { id, tagId } = req.params;

//     const candidate = await Candidate.findById(id);
//     if (!candidate) {
//       return res.status(404).json({ message: 'Candidate not found' });
//     }

//     // Check permissions
//     if (req.user.role === 'viewer') {
//       return res.status(403).json({ message: 'Viewers cannot remove tags' });
//     }

//     const tagIndex = candidate.tags.findIndex(tag => tag._id.toString() === tagId);
//     if (tagIndex === -1) {
//       return res.status(404).json({ message: 'Tag not found' });
//     }

//     // Only allow removal if user is admin or added the tag
//     if (req.user.role !== 'admin' && candidate.tags[tagIndex].addedBy.toString() !== req.user.id) {
//       return res.status(403).json({ message: 'You can only remove tags you added' });
//     }

//     candidate.tags.splice(tagIndex, 1);
//     await candidate.save();
//     res.json(candidate);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

exports.updateCandidateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Check if candidate belongs to the user's company
    if (candidate.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Access denied. Candidate does not belong to your company.' });
    }

    // Only restrict viewers
    if (req.user.role === 'viewer') {
      return res.status(403).json({ message: 'Viewers cannot update status' });
    }

    candidate.status = status;
    await candidate.save();

    res.json(candidate);
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.addNoteToCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Note content is required' });
    }

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Check if candidate belongs to the user's company
    if (candidate.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Access denied. Candidate does not belong to your company.' });
    }

    // Only restrict viewers
    if (req.user.role === 'viewer') {
      return res.status(403).json({ message: 'Viewers cannot add notes' });
    }

    candidate.notes.push({
      content: content.trim(),
      addedBy: req.user.id
    });

    await candidate.save();
    res.json(candidate);
  } catch (err) {
    console.error('Error adding note:', err);
    res.status(500).json({ error: err.message });
  }
};


// // Update candidate status
// exports.updateCandidateStatus = async (req, res) => {
//   try {
//     const { status } = req.body;
//     const { id } = req.params;

//     if (!status) {
//       return res.status(400).json({ message: 'Status is required' });
//     }

//     const candidate = await Candidate.findById(id);
//     if (!candidate) {
//       return res.status(404).json({ message: 'Candidate not found' });
//     }

//     // Check permissions
//     if (req.user.role === 'viewer') {
//       return res.status(403).json({ message: 'Viewers cannot update status' });
//     }

//     if (req.user.role === 'recruiter' && candidate.uploadedBy.toString() !== req.user.id) {
//       return res.status(403).json({ message: 'You can only update status for candidates you uploaded' });
//     }

//     candidate.status = status;
//     await candidate.save();

//     res.json(candidate);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Add note to candidate
// exports.addNoteToCandidate = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { content } = req.body;

//     if (!content || !content.trim()) {
//       return res.status(400).json({ message: 'Note content is required' });
//     }

//     const candidate = await Candidate.findById(id);
//     if (!candidate) {
//       return res.status(404).json({ message: 'Candidate not found' });
//     }

//     // Check permissions
//     if (req.user.role === 'viewer') {
//       return res.status(403).json({ message: 'Viewers cannot add notes' });
//     }

//     if (req.user.role === 'recruiter' && candidate.uploadedBy.toString() !== req.user.id) {
//       return res.status(403).json({ message: 'You can only add notes to candidates you uploaded' });
//     }

//     candidate.notes.push({
//       content: content.trim(),
//       addedBy: req.user.id
//     });

//     await candidate.save();
//     res.json(candidate);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


// Update note for candidate - Allow recruiters too
exports.updateNoteForCandidate = async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Note content is required' });
    }

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Check if candidate belongs to the user's company
    if (candidate.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Access denied. Candidate does not belong to your company.' });
    }

    // Find the note
    const noteIndex = candidate.notes.findIndex(note => note._id.toString() === noteId);
    if (noteIndex === -1) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check permissions - allow admin, recruiter, or note creator to update
    if (req.user.role !== 'admin' && req.user.role !== 'recruiter' && 
        candidate.notes[noteIndex].addedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own notes' });
    }

    // Update the note
    candidate.notes[noteIndex].content = content.trim();
    candidate.notes[noteIndex].updatedAt = new Date();

    await candidate.save();
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete note from candidate - Allow recruiters too
exports.deleteNoteFromCandidate = async (req, res) => {
  try {
    const { id, noteId } = req.params;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Check if candidate belongs to the user's company
    if (candidate.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Access denied. Candidate does not belong to your company.' });
    }

    // Find the note
    const noteIndex = candidate.notes.findIndex(note => note._id.toString() === noteId);
    if (noteIndex === -1) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check permissions - allow admin, recruiter, or note creator to delete
    if (req.user.role !== 'admin' && req.user.role !== 'recruiter' && 
        candidate.notes[noteIndex].addedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own notes' });
    }

    // Remove the note
    candidate.notes.splice(noteIndex, 1);
    await candidate.save();
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove tag from candidate - Allow recruiters too
exports.removeTagFromCandidate = async (req, res) => {
  try {
    const { id, tagId } = req.params;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Check if candidate belongs to the user's company
    if (candidate.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Access denied. Candidate does not belong to your company.' });
    }

    // Check permissions - only restrict viewers
    if (req.user.role === 'viewer') {
      return res.status(403).json({ message: 'Viewers cannot remove tags' });
    }

    const tagIndex = candidate.tags.findIndex(tag => tag._id.toString() === tagId);
    if (tagIndex === -1) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    // Allow removal if user is admin, recruiter, or added the tag
    if (req.user.role !== 'admin' && req.user.role !== 'recruiter' && 
        candidate.tags[tagIndex].addedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only remove tags you added' });
    }

    candidate.tags.splice(tagIndex, 1);
    await candidate.save();
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

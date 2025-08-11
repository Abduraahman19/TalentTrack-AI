const Candidate = require('../models/Candidate');
const JobDescription = require('../models/JobDescription');
const { parsePDF, parseDOCX } = require('../utils/parser');
const { calculateMatchScore, generateMatchExplanation } = require('../utils/skillMatcher');
const fs = require('fs');
const path = require('path');

exports.uploadResume = async (req, res) => {
  try {
    console.log('Upload request received'); // Debug log

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    console.log('File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    let parsedData;
    const filePath = req.file.path;

    try {
      const fileBuffer = fs.readFileSync(filePath);

      if (req.file.mimetype === 'application/pdf') {
        console.log('Processing PDF file');
        parsedData = await parsePDF(fileBuffer);
      } else if (req.file.mimetype.includes('wordprocessingml.document')) {
        console.log('Processing DOCX file');
        parsedData = await parseDOCX(fileBuffer);
      } else {
        console.error('Unsupported file type:', req.file.mimetype);
        fs.unlinkSync(filePath);
        return res.status(400).json({
          status: 'error',
          message: 'Unsupported file type. Only PDF and DOCX files are allowed.'
        });
      }

      console.log('Parsed data:', parsedData);
    } catch (parseError) {
      console.error('Parsing error:', parseError);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({
        status: 'error',
        message: 'Error parsing resume file',
        error: parseError.message
      });
    }

    // Create candidate record
    const candidate = new Candidate({
      ...parsedData,
      resumePath: `/uploads/${req.file.filename}`,
      uploadedBy: req.user.id
    });

    try {
      console.log('Finding job descriptions');
      const jobs = await JobDescription.find();
      console.log(`Found ${jobs.length} job descriptions`);

      for (const job of jobs) {
        console.log(`Calculating match for job: ${job.title}`);
        const score = calculateMatchScore(parsedData.skills, job.requiredSkills);
        const explanation = generateMatchExplanation(parsedData.skills, job.requiredSkills);

        candidate.roleMatchScores.push({
          roleId: job._id,
          score,
          explanation
        });
      }

      console.log('Saving candidate to database');
      await candidate.save();

      res.status(201).json({
        status: 'success',
        data: candidate
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(500).json({
        status: 'error',
        message: 'Error saving candidate data',
        error: dbError.message
      });
    }

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: err.message
    });
  }
};

// Add pagination and filtering to getCandidates
exports.getCandidates = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', minScore } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } }
      ];
    }

    if (minScore) {
      query['roleMatchScores.score'] = { $gte: parseInt(minScore) };
    }

    const candidates = await Candidate.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'firstName lastName email')
      .populate('roleMatchScores.roleId', 'title requiredSkills');

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
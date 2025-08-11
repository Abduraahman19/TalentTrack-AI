const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const {
  uploadResume,
  getCandidates
} = require('../controllers/resumeController');

// Role-based access
const checkRecruiter = auth.authorize('recruiter', 'admin');

router.post('/upload', checkRecruiter, upload.single('resume'), uploadResume);
router.get('/', auth.protect, getCandidates);

module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { uploadResume, getCandidates } = require('../controllers/resumeController');

// Only allow admin and recruiter roles to upload
const allowedRoles = auth.authorize('admin', 'recruiter');

router.post('/upload', auth.protect, allowedRoles, upload.single('resume'), uploadResume);
router.get('/', auth.protect, getCandidates);

module.exports = router;
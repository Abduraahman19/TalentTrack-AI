

// In your routes file (routes/jobDescription.js)
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const jobController = require('../controllers/jobDescriptionController');

// Allow both admin and recruiter to manage job descriptions
const adminOrRecruiter = auth.authorize(['admin', 'recruiter']);

router.post('/', auth.protect, adminOrRecruiter, jobController.createJobDescription);
router.get('/', auth.protect, jobController.getJobDescriptions);
router.put('/:id', auth.protect, adminOrRecruiter, jobController.updateJobDescription);
router.delete('/:id', auth.protect, adminOrRecruiter, jobController.deleteJobDescription);

module.exports = router;

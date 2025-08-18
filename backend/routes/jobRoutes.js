const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const jobController = require('../controllers/jobDescriptionController');

// Only admin can create/update/delete job descriptions
const adminOnly = auth.authorize('admin');

router.post('/', auth.protect, adminOnly, jobController.createJobDescription);
router.get('/', auth.protect, jobController.getJobDescriptions);
router.put('/:id', auth.protect, adminOnly, jobController.updateJobDescription);
router.delete('/:id', auth.protect, adminOnly, jobController.deleteJobDescription);

module.exports = router;
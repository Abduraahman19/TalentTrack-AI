const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const resumeController = require('../controllers/resumeController'); // ✅ full import

// Only allow admin and recruiter roles to upload
const allowedRoles = auth.authorize('admin', 'recruiter');

router.post(
  '/upload',
  auth.protect,
  allowedRoles,
  upload.single('resume'),
  resumeController.uploadResume
);

router.get('/', auth.protect, resumeController.getCandidates);

// Candidate routes
router.get('/:id', auth.protect, resumeController.getCandidateById);
router.post('/:candidateId/tags', auth.protect, resumeController.addTagToCandidate);
router.delete('/:candidateId/tags/:tagId', auth.protect, resumeController.removeTagFromCandidate);

module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const resumeController = require('../controllers/resumeController');
const { validateResumeFile } = require('../middleware/fileValidation');

// Only allow admin and recruiter roles to upload
const allowedRoles = auth.authorize('admin', 'recruiter');

router.post(
  '/upload',
  auth.protect,
  allowedRoles,
  upload.single('resume'),
  validateResumeFile, // Add this line
  resumeController.uploadResume
);

router.get('/', auth.protect, resumeController.getCandidates);

// Candidate routes
router.get('/:id', auth.protect, resumeController.getCandidateById);

// Tags routes
router.post('/:id/tags', auth.protect, resumeController.addTagToCandidate);
router.delete('/:id/tags/:tagId', auth.protect, resumeController.removeTagFromCandidate);

// Status route
router.put('/:id/status', auth.protect, resumeController.updateCandidateStatus);

// Notes routes - FIXED: Use consistent parameter names
router.post('/:id/notes', auth.protect, resumeController.addNoteToCandidate);
router.put('/:id/notes/:noteId', auth.protect, resumeController.updateNoteForCandidate);
router.delete('/:id/notes/:noteId', auth.protect, resumeController.deleteNoteFromCandidate);

module.exports = router;
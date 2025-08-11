const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me
router.get('/me', authMiddleware.protect, authController.getMe);

// POST /api/auth/logout
router.post('/logout', authMiddleware.protect, authController.logout);

module.exports = router;

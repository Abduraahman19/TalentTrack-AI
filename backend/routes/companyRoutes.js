const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/companies - Get all companies for dropdown
router.get('/', companyController.getCompanies);

module.exports = router;

const Company = require('../models/Company');

// Get all companies for dropdown
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true })
      .select('name industry website')
      .sort({ name: 1 })
      .collation({ locale: 'en', strength: 2 }); // Case-insensitive sort

    res.status(200).json({
      status: 'success',
      data: {
        companies
      }
    });
  } catch (err) {
    console.error('Get companies error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch companies'
    });
  }
};

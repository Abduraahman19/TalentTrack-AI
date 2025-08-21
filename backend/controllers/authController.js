const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

exports.register = async (req, res) => {
  try {
    console.log('=== REGISTRATION STARTED ===');
    console.log('Request body:', req.body);

    const { firstName, lastName, username, email, password, role, companyId, companyName } = req.body;

    console.log("Comapny Id", companyId)

    if (!firstName || !lastName || !username || !email || !password || !role) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    console.log('Basic validation passed');

    if (!validateEmail(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({ message: 'Invalid email format' });
    }

    console.log('Email validation passed');

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return res.status(400).json({
        message: 'User already exists',
        field: existingUser.email === email ? 'email' : 'username'
      });
    }

    console.log('No duplicate user found');

    let company;
    let user;

    if (role === 'admin') {
      console.log('Admin registration with company:', companyName);

      if (!companyName) {
        console.log('Company name required for admin');
        return res.status(400).json({ message: 'Company name is required for admin registration' });
      }

      const existingCompany = await Company.findOne({
        name: { $regex: new RegExp(`^${companyName}$`, 'i') }
      });

      if (existingCompany) {
        console.log('Company already exists:', companyName);
        return res.status(400).json({ message: 'Company name already exists' });
      }

      console.log('Company name is unique');

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      console.log('Password hashed');

      company = await Company.create({
        name: companyName,
        createdBy: null,
      });

      console.log("Company created:", company._id);

      user = await User.create({
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
        role,
        company: company._id
      });

      console.log('User created:', user._id);


      console.log('Company created:', company._id);

      company.createdBy = user._id;
      await company.save();


      console.log('Company updated with creator:', company._id);

      console.log('User updated with company reference');

    } else {
      console.log('Recruiter/viewer registration with company ID:', companyId);

      if (!companyId) {
        console.log('Company selection required');
        return res.status(400).json({ message: 'Company selection is required' });
      }

      company = await Company.findById(companyId);
      if (!company) {
        console.log('Company not found:', companyId);
        return res.status(400).json({ message: 'Selected company does not exist' });
      }

      console.log('Company found:', company.name);

      if (role === 'recruiter') {
        const recruiterCount = await User.countDocuments({
          company: companyId,
          role: 'recruiter',
          isActive: true
        });

        console.log('Current recruiter count:', recruiterCount);

        if (recruiterCount >= 5) {
          return res.status(400).json({
            message: 'Maximum of 5 recruiters allowed per company'
          });
        }
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = await User.create({
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
        role,
        company: companyId
      });

      console.log('User created for company:', user._id);
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        company: user.company
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    user.password = undefined;

    console.log('=== REGISTRATION SUCCESSFUL ===');

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user
      }
    });

  } catch (err) {
    console.error('=== REGISTRATION ERROR ===');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);

    if (err.code === 11000) {
      console.log('Duplicate key error:', err.keyValue);
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({
        message: `${field} already exists`,
        field
      });
    }

    if (err.name === 'ValidationError') {
      console.log('Mongoose validation error:', err.errors);
      const errors = {};
      Object.keys(err.errors).forEach(key => {
        errors[key] = err.errors[key].message;
      });
      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }

    console.error('Unexpected error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true })
      .select('name industry website')
      .sort({ name: 1 });

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

exports.login = async (req, res) => {
  try {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Login data:', req.body);

    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      console.log('Missing email/username or password');
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email/username and password'
      });
    }

    const user = await User.findOne({
      $or: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ]
    }).select('+password');

    console.log('User found:', user);

    if (!user) {
      console.log('User not found');
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email/username or password'
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    console.log('Password correct:', isPasswordCorrect);

    if (!isPasswordCorrect) {
      console.log('Incorrect password');
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email/username or password'
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        company: user.company
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user.password = undefined;

    console.log('=== LOGIN SUCCESSFUL ===');
    console.log('User logged in:', user.email);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};


exports.getMe = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};  

// middleware/authMiddleware.js - Updated
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// middleware/authMiddleware.js - Ensure company is properly set
exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      return res.status(401).json({ message: 'Please log in to access this resource' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Make sure decoded contains the role and company
    if (!decoded.id || !decoded.role || !decoded.company) {
      return res.status(401).json({ message: 'Invalid token structure' });
    }

    // Get the full user to ensure we have the correct company info
    const user = await User.findById(decoded.id).select('company role');
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    // Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      company: user.company // Use the company from the database, not the token
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// middleware/authMiddleware.js
exports.authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

// New middleware to check if user belongs to the same company
exports.sameCompany = (req, res, next) => {
  // For routes that have resource IDs, we need to check if the resource belongs to the same company
  // This will be implemented in individual controllers as needed
  next();
};

const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'The user belonging to this token no longer exists' });
    }

    // Only attach minimal info to req.user (avoid sending full mongoose doc)
    req.user = { id: user._id.toString(), role: user.role };

    next();
  } catch (error) {
    console.error('Auth protect error:', error);
    return res.status(500).json({ message: 'Authentication middleware error' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user?.role} is not authorized to access this route`
      });
    }
    next();
  };
};

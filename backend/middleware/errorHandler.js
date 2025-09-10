
function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);
  
  // Cloudinary errors
  if (err.message && err.message.includes('Cloudinary')) {
    return res.status(400).json({ 
      success: false, 
      message: 'Cloudinary upload failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  // File type errors
  if (err.message && err.message.includes('Only PDF')) {
    return res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
  
  // File size errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ 
      success: false, 
      message: 'File too large (max 5MB)' 
    });
  }
  
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }
  
  // Default error
  return res.status(500).json({ 
    success: false, 
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}

module.exports = errorHandler;
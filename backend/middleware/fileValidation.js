// middleware/fileValidation.js
const fs = require('fs');
const pdf = require('pdf-parse');

const validateResumeFile = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // Check file size (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'File size exceeds 5MB limit' });
    }

    // Check if file is readable
    const fileBuffer = fs.readFileSync(req.file.path);
    
    if (req.file.mimetype === 'application/pdf') {
      // Try to parse PDF to check if it's valid
      try {
        const data = await pdf(fileBuffer);
        if (!data.text || data.text.trim().length < 50) {
          throw new Error('PDF appears to be empty or corrupted');
        }
      } catch (pdfError) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          message: 'Invalid PDF file. The file may be corrupted or password protected.' 
        });
      }
    }
    
    next();
  } catch (error) {
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ message: 'File validation failed' });
  }
};

module.exports = { validateResumeFile };
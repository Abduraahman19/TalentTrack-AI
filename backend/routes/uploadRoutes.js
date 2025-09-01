const express = require('express');
const router = express.Router();
const { upload, cloudinary } = require('../config/cloudinary');

// Single file upload (field name: "resume")
router.post('/cv', upload.single('resume'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const fileData = {
      success: true,
      message: 'Uploaded to Cloudinary',
      fileUrl: req.file.path,
      publicId: req.file.filename,
      resourceType: req.file.resource_type,
      bytes: req.file.size,
      originalName: req.file.originalname
    };

    return res.status(200).json(fileData);
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ success: false, message: 'Upload failed', error: err.message });
  }
});

// Multiple files (max 5) - field name: "resumes"
router.post('/cv-multiple', upload.array('resumes', 5), (req, res) => {
  try {
    const files = (req.files || []).map(f => ({
      fileUrl: f.path,
      publicId: f.filename,
      resourceType: f.resource_type,
      bytes: f.size,
      originalName: f.originalname
    }));
    return res.status(200).json({ success: true, files });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Upload failed', error: err.message });
  }
});

// Delete file by publicId
router.delete('/cv/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
    return res.json({ success: true, result });
  } catch (e) {
    console.error('Delete error:', e);
    return res.status(500).json({ success: false, message: 'Delete failed', error: e.message });
  }
});

module.exports = router;
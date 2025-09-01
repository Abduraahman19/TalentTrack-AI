require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer-Cloudinary storage with public access
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: 'resume-uploads',
      resource_type: 'raw', // Use 'raw' instead of 'auto' for better control
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      type: 'upload',
      access_mode: 'public' // Make files publicly accessible
    };
  },
});

// File filter: only PDF/DOC/DOCX
const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF / DOC / DOCX files are allowed'));
  }
};

const limits = {
  fileSize: Number(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024),
};

const upload = multer({ storage, fileFilter, limits });

module.exports = { cloudinary, upload };
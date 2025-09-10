// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const path = require('path');
// const rateLimit = require('express-rate-limit');
// const connectDB = require('./config/db');
// const errorHandler = require('./middleware/errorHandler');

// // Connect to database
// connectDB();

// const app = express();

// // Rate limiting middleware
// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again after 15 minutes'
// });

// // Middleware
// // Replace your current CORS config with this:
// app.use(cors({
//   origin: [
//     'https://talent-track-ai-six.vercel.app',
//     'http://localhost:5173',
//     'http://localhost:3000'
//   ],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
// }));

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Apply rate limiting to API routes
// app.use('/api/', apiLimiter);

// // Routes
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/resumes', require('./routes/resumeRoutes'));
// app.use('/api/jobs', require('./routes/jobRoutes'));
// app.use('/api/companies', require('./routes/companyRoutes'));

// // Cloudinary upload routes
// app.use('/api/upload', require('./routes/uploadRoutes'));

// // Error handling middleware
// app.use(errorHandler);

// const PORT = process.env.PORT || 5000;

// const server = app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err) => {
//   console.error('Unhandled Rejection:', err);
//   server.close(() => process.exit(1));
// });




require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Connect to database
connectDB();

const app = express();

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// CORS config
app.use(cors({
  origin: [
    'https://talenttrack-ai.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/resumes', require('./routes/resumeRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Default root route (to avoid "Cannot GET /")
app.get("/", (req, res) => {
  res.send("🚀 Talent Track API is running successfully!");
});

// Error handling middleware
app.use(errorHandler);

// ❌ Local server listen (not for Vercel)
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// ✅ Export app for Vercel
module.exports = app;

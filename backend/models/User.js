const mongoose = require('mongoose');
let validator;
try {
  validator = require('validator');
} catch (err) {
  console.warn('Validator module not found, using simple validation');
  validator = {
    isEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  };
}

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9_]+$/.test(v);
      },
      message: 'Username can only contain letters, numbers and underscores'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['recruiter', 'admin', 'viewer'],
    default: 'recruiter'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
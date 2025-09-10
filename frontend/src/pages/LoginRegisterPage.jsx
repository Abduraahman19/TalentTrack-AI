import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '../context/SnackbarContext';
import Snackbar from '@mui/material/Snackbar';
import { AuthContext } from '../context/AuthContext';
import Alert from '@mui/material/Alert';
import axios from 'axios';
import { Helmet } from 'react-helmet';

// Enhanced validation functions
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password);
};

const LoginRegisterPage = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { login } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [buttonLoading, setButtonLoading] = useState({
    login: false,
    register: false,
    demo: false,
    explore: false
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Update register form state
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    role: 'recruiter',
    companyId: '',
    companyName: ''
  });

  const [registerErrors, setRegisterErrors] = useState({});
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const [loginForm, setLoginForm] = useState({
    emailOrUsername: '',
    password: ''
  });

  const [loginErrors, setLoginErrors] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch companies for dropdown
  useEffect(() => {
    if (!isLogin) {
      fetchCompanies();
    }
  }, [isLogin]);

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await axios.get('https://talent-track-ai-backend.vercel.app/api/companies'); // Correct endpoint

      if (response.data && response.data.data && response.data.data.companies) {
        setCompanies(response.data.data.companies);
      } else {
        setCompanies([]);
        console.error('Unexpected response format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);

      if (error.response && error.response.status === 404) {
        // API endpoint not found, use fallback
        console.log('Companies endpoint not available, using fallback');
        setCompanies([
          { _id: '1', name: 'Tech Solutions Inc.' },
          { _id: '2', name: 'Global Innovations Ltd.' },
          { _id: '3', name: 'Digital Creations Co.' }
        ]);
      } else {
        showSnackbar('Failed to load companies', 'error');
      }
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Update validation function
  const validateRegisterForm = () => {
    const errors = {};

    if (!registerForm.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (registerForm.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    if (!registerForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (registerForm.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    if (!registerForm.username.trim()) {
      errors.username = 'Username is required';
    } else if (registerForm.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(registerForm.username)) {
      errors.username = 'Username can only contain letters, numbers and underscores';
    }

    if (!registerForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(registerForm.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!registerForm.password) {
      errors.password = 'Password is required';
    } else if (!validatePassword(registerForm.password)) {
      errors.password = 'Password must be at least 8 characters with uppercase, lowercase, number and special character';
    }

    // Company validation based on role
    if (registerForm.role === 'admin') {
      if (!registerForm.companyName.trim()) {
        errors.companyName = 'Company name is required for admin';
      }
    } else {
      if (!registerForm.companyId) {
        errors.companyId = 'Please select a company';
      }
    }

    return errors;
  };
  const validateLoginForm = () => {
    const errors = {};

    if (!loginForm.emailOrUsername.trim()) {
      errors.emailOrUsername = 'Email or username is required';
    }

    if (!loginForm.password) {
      errors.password = 'Password is required';
    }

    return errors;
  };

  // Update handleRegisterChange function
  const handleRegisterChange = (field, value) => {
    setRegisterForm(prev => ({
      ...prev,
      [field]: value,
      // Reset company fields when role changes
      ...(field === 'role' && {
        companyId: '',
        companyName: ''
      })
    }));
    if (registerErrors[field]) {
      setRegisterErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLoginChange = (field, value) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
    if (loginErrors[field]) {
      setLoginErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const errors = validateRegisterForm();
    setRegisterErrors(errors);

    if (Object.keys(errors).length === 0) {
      setButtonLoading(prev => ({ ...prev, register: true }));
      try {
        console.log('Sending registration data:', {
          firstName: registerForm.firstName,
          lastName: registerForm.lastName,
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password,
          role: registerForm.role,
          companyId: registerForm.role !== 'admin' ? registerForm.companyId : undefined,
          companyName: registerForm.role === 'admin' ? registerForm.companyName : undefined
        });

        const response = await axios.post('https://talent-track-ai-backend.vercel.app/api/auth/register', {
          firstName: registerForm.firstName,
          lastName: registerForm.lastName,
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password,
          role: registerForm.role,
          companyId: registerForm.role !== 'admin' ? registerForm.companyId : undefined,
          companyName: registerForm.role === 'admin' ? registerForm.companyName : undefined
        });

        if (response.data.status === 'success') {
          showSnackbar('Account created successfully!', 'success');

          // Auto-login after successful registration
          login(response.data.data.user, response.data.token);

          // Reset form
          setRegisterForm({
            firstName: '',
            lastName: '',
            username: '',
            email: '',
            password: '',
            role: 'recruiter',
            companyId: '',
            companyName: ''
          });

          // Redirect viewers to jobs page, others to home
          if (response.data.data.user.role === 'viewer') {
            navigate('/jobs');
          } else {
            navigate('/home');
          }

        } else {
          showSnackbar(response.data.message || 'Registration failed', 'error');
        }
      } catch (error) {
        console.error('Registration error details:', error);

        if (error.response && error.response.data) {
          if (error.response.data.errors) {
            setRegisterErrors(error.response.data.errors);
          } else if (error.response.data.field) {
            setRegisterErrors({ [error.response.data.field]: error.response.data.message });
          }
          showSnackbar(error.response.data.message || 'Registration failed', 'error');
        } else if (error.request) {
          showSnackbar('Network error. Please check your connection.', 'error');
        } else {
          showSnackbar('An error occurred during registration', 'error');
        }
      } finally {
        setButtonLoading(prev => ({ ...prev, register: false }));
      }
    }
  };


  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const errors = validateLoginForm();
    setLoginErrors(errors);

    if (Object.keys(errors).length === 0) {
      setButtonLoading(prev => ({ ...prev, login: true }));
      try {
        console.log('Attempting login with:', loginForm);

        const response = await axios.post('https://talent-track-ai-backend.vercel.app/api/auth/login', {
          emailOrUsername: loginForm.emailOrUsername,
          password: loginForm.password
        });

        console.log('Login response:', response.data);

        if (response.data.status === 'success') {
          showSnackbar('Login successful!', 'success');

          // Use the login function from AuthContext
          login(response.data.data.user, response.data.token);

          navigate('/home');
        } else {
          showSnackbar(response.data.message || 'Login failed', 'error');
        }
      } catch (error) {
        console.error('Login error details:', error);

        if (error.response && error.response.data) {
          showSnackbar(error.response.data.message || 'Login failed', 'error');
        } else {
          showSnackbar('An error occurred during login', 'error');
        }
      } finally {
        setButtonLoading(prev => ({ ...prev, login: false }));
      }
    }
  };

  const handleDemoClick = () => {
    setButtonLoading(prev => ({ ...prev, demo: true }));
    setTimeout(() => {
      setButtonLoading(prev => ({ ...prev, demo: false }));
      showSnackbar('Demo feature coming soon!', 'info');
    }, 1500);
  };

  const handleExploreClick = () => {
    setButtonLoading(prev => ({ ...prev, explore: true }));
    setTimeout(() => {
      setButtonLoading(prev => ({ ...prev, explore: false }));
      showSnackbar('Exploring features...', 'info');
    }, 1500);
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleRegisterPasswordVisibility = () => setShowRegisterPassword(!showRegisterPassword);

  const LoadingSpinner = () => (
    <svg
      className="w-4 h-4 text-current animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  const PasswordStrengthIndicator = ({ password }) => {
    if (!password) return null;

    const strength = {
      width: '0%',
      color: 'bg-gray-200',
      text: ''
    };

    if (password.length > 0) {
      strength.width = '20%';
      strength.color = 'bg-red-500';
      strength.text = 'Very Weak';
    }

    if (password.length >= 6) {
      strength.width = '40%';
      strength.color = 'bg-orange-500';
      strength.text = 'Weak';
    }

    if (password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password)) {
      strength.width = '60%';
      strength.color = 'bg-yellow-500';
      strength.text = 'Moderate';
    }

    if (password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password)) {
      strength.width = '80%';
      strength.color = 'bg-blue-500';
      strength.text = 'Strong';
    }

    if (password.length >= 10 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength.width = '100%';
      strength.color = 'bg-green-500';
      strength.text = 'Very Strong';
    }

    return (
      <div className="mt-1">
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${strength.color}`}
            style={{ width: strength.width }}
          ></div>
        </div>
        {password && (
          <p className="mt-1 text-xs text-gray-500">
            Password strength: <span className={`font-medium ${strength.color.replace('bg', 'text')}`}>
              {strength.text}
            </span>
          </p>
        )}
      </div>
    );
  };

  const RoleSelector = () => {
    const roles = [
      { value: 'recruiter', label: 'Recruiter', icon: '👔', description: 'Hire and manage candidates' },
      { value: 'admin', label: 'Admin', icon: '🔑', description: 'Full system access' },
      { value: 'viewer', label: 'Viewer', icon: '👁️', description: 'Read-only access' }
    ];

    return (
      <div className="relative">
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Role
        </label>
        <button
          type="button"
          onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
          className="flex items-center justify-between w-full px-3 py-2 transition-colors bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="flex items-center">
            <span className="mr-2 text-lg">
              {roles.find(r => r.value === registerForm.role)?.icon}
            </span>
            <span>{roles.find(r => r.value === registerForm.role)?.label}</span>
          </div>
          <motion.svg
            animate={{ rotate: isRoleDropdownOpen ? 180 : 0 }}
            className="w-5 h-5 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </motion.svg>
        </button>

        <AnimatePresence>
          {isRoleDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-10 w-full py-1 mt-1 text-base bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
              {roles.map((role) => (
                <div
                  key={role.value}
                  onClick={() => {
                    handleRegisterChange('role', role.value);
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`flex items-center px-4 py-2 cursor-pointer hover:bg-blue-50 ${registerForm.role === role.value ? 'bg-blue-100' : ''}`}
                >
                  <span className="mr-3 text-lg">{role.icon}</span>
                  <div>
                    <div className="font-medium">{role.label}</div>
                    <div className="text-xs text-gray-500">{role.description}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-gray-50">
      <Helmet>
        <title>{isLogin ? 'Login' : 'Register'} | TalentTrack AI</title>
        <meta name="description" content={`${isLogin ? 'Login' : 'Register'} to access TalentTrack AI's powerful recruitment platform`} />
      </Helmet>

      {/* Left Side - Branding Section */}
      {!isMobile && (
        <div className="relative items-center justify-center hidden overflow-hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-blue-900/20 to-indigo-900/30 animate-gradient-pulse"></div>

          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white/5"
                style={{
                  width: `${Math.random() * 10 + 5}px`,
                  height: `${Math.random() * 10 + 5}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `float ${Math.random() * 10 + 10}s linear infinite`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              />
            ))}
          </div>

          <div className="absolute w-32 h-32 bg-blue-600 rounded-full top-20 left-20 opacity-10 animate-float-slow"></div>
          <div className="absolute w-24 h-24 bg-indigo-500 rounded-full bottom-20 right-20 opacity-15 animate-float-medium"></div>
          <div className="absolute w-16 h-16 bg-blue-400 rounded-full top-1/3 right-1/4 opacity-20 animate-float-fast"></div>
          <div className="absolute w-20 h-20 bg-indigo-400 rounded-full bottom-1/4 left-1/3 opacity-15 animate-float-slow"></div>

          <div className="relative z-10 w-full px-12 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-6xl font-bold tracking-wider text-transparent text-white bg-clip-text bg-gradient-to-r from-blue-200 to-white"
            >
              TalentTrack AI
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-6 space-y-4"
            >
              <h2 className="text-5xl font-bold leading-tight text-white drop-shadow-lg">
                {isLogin ? 'Welcome Back' : 'Get Started'}
              </h2>
              <p className="max-w-md mx-auto text-xl font-light leading-relaxed text-blue-200">
                {isLogin
                  ? 'Continue your journey with our powerful platform'
                  : 'Join thousands of professionals revolutionizing their workflow'}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center mt-12"
            >
              <button
                onClick={isLogin ? handleExploreClick : handleDemoClick}
                disabled={buttonLoading.explore || buttonLoading.demo}
                className="flex items-center justify-center gap-2 px-8 py-3 font-medium text-white transition-all duration-300 border rounded-full bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {buttonLoading.explore || buttonLoading.demo ? (
                  <>
                    <LoadingSpinner />
                    {isLogin ? 'Loading...' : 'Preparing...'}
                  </>
                ) : (
                  <>
                    {isLogin ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Explore Features
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        See Demo
                      </>
                    )}
                  </>
                )}
              </button>
            </motion.div>
          </div>

          <div className="absolute left-0 right-0 text-center bottom-6">
            <p className="text-sm text-blue-300">
              © {new Date().getFullYear()} TalentTrack AI. All rights reserved.
            </p>
          </div>
        </div>
      )}

      {/* Right Side - Forms */}
      <div className="flex items-center justify-center w-full p-6 overflow-auto lg:w-1/2 lg:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          {isMobile && (
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold tracking-wider text-blue-900">TalentTrack AI</h1>
              <p className="mt-2 text-gray-600">
                {isLogin ? 'Login to your account' : 'Create a new account'}
              </p>
            </div>
          )}

          {/* Toggle Buttons */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex p-1 mb-4 bg-white rounded-lg shadow-sm"
          >
            <button
              onClick={() => setIsLogin(false)}
              disabled={buttonLoading.register}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${!isLogin
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
                } ${buttonLoading.register ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {buttonLoading.register ? (
                <>
                  <LoadingSpinner />
                  Processing...
                </>
              ) : (
                'Create an account'
              )}
            </button>
            <button
              onClick={() => setIsLogin(true)}
              disabled={buttonLoading.login}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${isLogin
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
                } ${buttonLoading.login ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {buttonLoading.login ? (
                <>
                  <LoadingSpinner />
                  Signing in...
                </>
              ) : (
                'Login to your account'
              )}
            </button>
          </motion.div>

          {/* Register Form */}
          {!isLogin && (
            <motion.form
              onSubmit={handleRegisterSubmit}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="px-6 py-6 bg-white shadow-lg rounded-xl"
            >
              <h3 className="mb-4 text-2xl font-bold text-gray-800">Create your account</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={registerForm.firstName}
                      onChange={(e) => handleRegisterChange('firstName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${registerErrors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="John"
                    />
                    {registerErrors.firstName && (
                      <div className="mt-1 text-xs text-red-500">{registerErrors.firstName}</div>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={registerForm.lastName}
                      onChange={(e) => handleRegisterChange('lastName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${registerErrors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Doe"
                    />
                    {registerErrors.lastName && (
                      <div className="mt-1 text-xs text-red-500">{registerErrors.lastName}</div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    value={registerForm.username}
                    onChange={(e) => handleRegisterChange('username', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${registerErrors.username ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="johndoe123"
                  />
                  {registerErrors.username && (
                    <div className="mt-1 text-xs text-red-500">{registerErrors.username}</div>
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => handleRegisterChange('email', e.target.value)}
                    placeholder="john.doe@example.com"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${registerErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {registerErrors.email && (
                    <div className="mt-1 text-xs text-red-500">{registerErrors.email}</div>
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      value={registerForm.password}
                      onChange={(e) => handleRegisterChange('password', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${registerErrors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={toggleRegisterPasswordVisibility}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    >
                      {showRegisterPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={registerForm.password} />
                  {registerErrors.password && (
                    <div className="mt-1 text-xs text-red-500">{registerErrors.password}</div>
                  )}
                </div>

                <RoleSelector />

                {!isLogin && (
                  <>
                    {/* Company Selection Field */}
                    {registerForm.role !== 'admin' ? (
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                          Select Company
                        </label>
                        <select
                          value={registerForm.companyId}
                          onChange={(e) => handleRegisterChange('companyId', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${registerErrors.companyId ? 'border-red-500' : 'border-gray-300'
                            }`}
                          disabled={loadingCompanies}
                        >
                          <option value="">Select a company</option>
                          {companies.map(company => (
                            <option key={company._id} value={company._id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                        {registerErrors.companyId && (
                          <div className="mt-1 text-xs text-red-500">{registerErrors.companyId}</div>
                        )}
                        {loadingCompanies && (
                          <div className="mt-1 text-xs text-gray-500">Loading companies...</div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={registerForm.companyName}
                          onChange={(e) => handleRegisterChange('companyName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${registerErrors.companyName ? 'border-red-500' : 'border-gray-300'
                            }`}
                          placeholder="Enter your company name"
                        />
                        {registerErrors.companyName && (
                          <div className="mt-1 text-xs text-red-500">{registerErrors.companyName}</div>
                        )}
                      </div>
                    )}
                  </>
                )}


                <button
                  type="submit"
                  disabled={buttonLoading.register}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-2.5 px-4 rounded-md transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {buttonLoading.register ? (
                    <>
                      <LoadingSpinner />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Create account
                    </>
                  )}
                </button>

                <div className="mt-3 text-sm text-center text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Log in
                  </button>
                </div>
              </div>
            </motion.form>
          )}

          {/* Login Form */}
          {isLogin && (
            <motion.form
              onSubmit={handleLoginSubmit}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6 bg-white shadow-lg rounded-xl"
            >
              <h3 className="mb-4 text-2xl font-bold text-gray-800">Welcome back</h3>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Email or Username
                  </label>
                  <input
                    type="text"
                    value={loginForm.emailOrUsername}
                    onChange={(e) => handleLoginChange('emailOrUsername', e.target.value)}
                    placeholder="john.doe@example.com"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${loginErrors.emailOrUsername ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {loginErrors.emailOrUsername && (
                    <div className="mt-1 text-xs text-red-500">{loginErrors.emailOrUsername}</div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:underline hover:text-blue-700"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginForm.password}
                      onChange={(e) => handleLoginChange('password', e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${loginErrors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <div className="mt-1 text-xs text-red-500">{loginErrors.password}</div>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="remember-me" className="block ml-2 text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={buttonLoading.login}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-2.5 px-4 rounded-md transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {buttonLoading.login ? (
                    <>
                      <LoadingSpinner />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Login now
                    </>
                  )}
                </button>
                <div className="mt-3 text-sm text-center text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </div>
      </div>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default LoginRegisterPage;
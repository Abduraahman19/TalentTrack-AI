import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SnackbarContext } from '../context/SnackbarContext';
import Snackbar from '@mui/material/Snackbar';
import { AuthContext } from '../context/AuthContext';
import Alert from '@mui/material/Alert';
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
  const { showSnackbar } = useContext(SnackbarContext);
  const { login } = useContext(AuthContext); 
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
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

  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    role: 'recruiter'
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

  const handleRegisterChange = (field, value) => {
    setRegisterForm(prev => ({ ...prev, [field]: value }));
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
        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          credentials: 'include', // if using cookies
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registerForm) // Changed from 'data' to 'registerForm'
        });

        const data = await response.json();

        if (response.ok) {
          showSnackbar('Account created successfully!', 'success');
          setRegisterForm({
            firstName: '',
            lastName: '',
            username: '',
            email: '',
            password: '',
            role: 'recruiter'
          });
          navigate('/home');
        } else {
          showSnackbar(data.message || 'Registration failed', 'error');
        }
      } catch (error) {
        showSnackbar('An error occurred during registration', 'error');
        console.error('Registration error:', error);
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
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginForm),
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.message || 'Login failed');
        }

        // Properly access the nested user data
        const userData = responseData.data?.user;
        const token = responseData.token;

        if (!userData || !token) {
          throw new Error('Invalid response from server');
        }

        // Use the login function from AuthContext
        login(userData, token);

        showSnackbar('Login successful!', 'success');
        navigate('/home');
      } catch (error) {
        console.error('Login error:', error);
        showSnackbar(error.message || 'Login failed', 'error');
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
      className="animate-spin h-4 w-4 text-current"
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
          <p className="text-xs mt-1 text-gray-500">
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role
        </label>
        <button
          type="button"
          onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center justify-between bg-white"
        >
          <div className="flex items-center">
            <span className="mr-2 text-lg">
              {roles.find(r => r.value === registerForm.role)?.icon}
            </span>
            <span>{roles.find(r => r.value === registerForm.role)?.label}</span>
          </div>
          <motion.svg
            animate={{ rotate: isRoleDropdownOpen ? 180 : 0 }}
            className="h-5 w-5 text-gray-500"
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
              className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none"
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
                  <span className="text-lg mr-3">{role.icon}</span>
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
    <div className="min-h-screen flex overflow-hidden bg-gray-50">
      <Helmet>
        <title>{isLogin ? 'Login' : 'Register'} | TalentTrack AI</title>
        <meta name="description" content={`${isLogin ? 'Login' : 'Register'} to access TalentTrack AI's powerful recruitment platform`} />
      </Helmet>

      {/* Left Side - Branding Section */}
      {!isMobile && (
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 items-center justify-center relative overflow-hidden">
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

          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-600 rounded-full opacity-10 animate-float-slow"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-indigo-500 rounded-full opacity-15 animate-float-medium"></div>
          <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-blue-400 rounded-full opacity-20 animate-float-fast"></div>
          <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-indigo-400 rounded-full opacity-15 animate-float-slow"></div>

          <div className="relative z-10 text-center px-12 w-full">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-white text-6xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white"
            >
              TalentTrack AI
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-4 mt-6"
            >
              <h2 className="text-white text-5xl font-bold leading-tight drop-shadow-lg">
                {isLogin ? 'Welcome Back' : 'Get Started'}
              </h2>
              <p className="text-blue-200 text-xl font-light max-w-md mx-auto leading-relaxed">
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
                className="px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-medium hover:bg-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Explore Features
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

          <div className="absolute bottom-6 left-0 right-0 text-center">
            <p className="text-blue-300 text-sm">
              © {new Date().getFullYear()} TalentTrack AI. All rights reserved.
            </p>
          </div>
        </div>
      )}

      {/* Right Side - Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8 overflow-auto">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          {isMobile && (
            <div className="text-center mb-8">
              <h1 className="text-blue-900 text-4xl font-bold tracking-wider">TalentTrack AI</h1>
              <p className="text-gray-600 mt-2">
                {isLogin ? 'Login to your account' : 'Create a new account'}
              </p>
            </div>
          )}

          {/* Toggle Buttons */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex mb-4 bg-white rounded-lg shadow-sm p-1"
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
              className="bg-white rounded-xl shadow-lg px-6 py-6"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Create your account</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      <div className="text-red-500 text-xs mt-1">{registerErrors.firstName}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      <div className="text-red-500 text-xs mt-1">{registerErrors.lastName}</div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <div className="text-red-500 text-xs mt-1">{registerErrors.username}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <div className="text-red-500 text-xs mt-1">{registerErrors.email}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showRegisterPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={registerForm.password} />
                  {registerErrors.password && (
                    <div className="text-red-500 text-xs mt-1">{registerErrors.password}</div>
                  )}
                </div>

                <RoleSelector />

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
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Create account
                    </>
                  )}
                </button>

                <div className="text-center text-sm text-gray-600 mt-3">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
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
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Welcome back</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <div className="text-red-500 text-xs mt-1">{loginErrors.emailOrUsername}</div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-sm hover:underline text-blue-600 hover:text-blue-700"
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
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <div className="text-red-500 text-xs mt-1">{loginErrors.password}</div>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
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
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Login now
                    </>
                  )}
                </button>
                <div className="text-center text-sm text-gray-600 mt-3">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
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
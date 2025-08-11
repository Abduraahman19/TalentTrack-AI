import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Request interceptor
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only handle unauthorized if it's not a token refresh endpoint
      if (!error.config.url.includes('/auth/refresh')) {
        localStorage.removeItem('token');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export const register = (userData) => API.post('/auth/register', userData);
export const login = (credentials) => API.post('/auth/login', credentials);
export const getMe = () => API.get('/auth/me');
export const logout = () => API.post('/auth/logout');

export const uploadResume = (formData, token) => {
  return API.post('/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`
    },
    timeout: 30000 // 30 seconds timeout
  }).catch(error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Server responded with error:', error.response.data);
      throw new Error(error.response.data.message || 'Upload failed');
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      throw new Error('No response from server. Please try again.');
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
      throw new Error('Request setup failed. Please try again.');
    }
  });
};

export const getCandidates = (params = {}) => API.get('/resumes', { params });

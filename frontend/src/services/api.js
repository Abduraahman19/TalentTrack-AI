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
  console.log(formData)
  return API.post('/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`
    }
  }).catch(error => {
    if (error.response) {
      throw new Error(error.response.data.message || 'Upload failed');
    } else {
      throw new Error('Network error. Please try again.');
    }
  });
};

export const getCandidates = (params = {}) =>
  API.get('/resumes', { params })
    .then(response => {
      // Ensure we always return an array in the data property
      return {
        ...response,
        data: Array.isArray(response.data?.data) ? response.data.data : []
      };
    })
    .catch(error => {
      console.error('Error fetching candidates:', error);
      // Return empty array on error
      return { data: [] };
    });
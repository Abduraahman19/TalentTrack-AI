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
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const register = (userData) => API.post('/auth/register', userData);
export const login = (credentials) => API.post('/auth/login', credentials);
export const getMe = () => API.get('/auth/me');
export const logout = () => API.post('/auth/logout');

export const uploadResume = (formData) => {
  console.log('Uploading file:', formData);
  return API.post('/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  }).catch(error => {
    console.error('Upload error:', error);
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

// Job Descriptions
export const createJobDescription = (data) => {
  console.log('Sending job data:', data);
  return API.post('/jobs', data).catch(error => {
    console.error('Detailed API error:', {
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
      request: error.request,
      config: error.config
    });
    throw error;
  });
};

export const getJobDescriptions = (params = {}) => API.get('/jobs', { params });
export const updateJobDescription = (id, data) => API.put(`/jobs/${id}`, data);
export const deleteJobDescription = (id) => API.delete(`/jobs/${id}`);

// Candidate Tags
export const addTagToCandidate = (candidateId, tagData) =>
  API.post(`/resumes/${candidateId}/tags`, tagData);

export const removeTagFromCandidate = (candidateId, tagId) =>
  API.delete(`/resumes/${candidateId}/tags/${tagId}`);

// Candidate Status
export const updateCandidateStatus = (candidateId, statusData) =>
  API.put(`/resumes/${candidateId}/status`, statusData);

// Candidate Notes
export const addNoteToCandidate = (candidateId, noteData) =>
  API.post(`/resumes/${candidateId}/notes`, noteData);

export const updateNoteForCandidate = (candidateId, noteId, noteData) =>
  API.put(`/resumes/${candidateId}/notes/${noteId}`, noteData);

export const deleteNoteFromCandidate = (candidateId, noteId) =>
  API.delete(`/resumes/${candidateId}/notes/${noteId}`);

// Get single candidate
export const getCandidateById = (id) => API.get(`/resumes/${id}`);
// Add this to your API functions
export const getCompanies = () => API.get('/companies');

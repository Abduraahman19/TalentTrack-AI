
import { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadResume, getCandidates } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiUpload, FiX, FiCheck, FiLoader, FiUsers } from 'react-icons/fi';

const ResumeUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [recentCandidates, setRecentCandidates] = useState([]);
  const { user } = useContext(AuthContext);
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Fetch recent candidates on component mount
  useEffect(() => {
    const fetchRecentCandidates = async () => {
      try {
        const response = await getCandidates({ limit: 3 });
        if (response.data) {
          setRecentCandidates(response.data);
        }
      } catch (error) {
        console.error('Error fetching candidates:', error);
      }
    };

    fetchRecentCandidates();
  }, []);

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (validateFileType(droppedFile)) {
        setFile(droppedFile);
        setFileName(droppedFile.name);
      } else {
        setError('Only PDF and DOCX files are allowed');
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (validateFileType(selectedFile)) {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setError('');
      } else {
        setError('Only PDF and DOCX files are allowed');
      }
    }
  };

  const validateFileType = (file) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    return validTypes.includes(file.type);
  };

  const removeFile = () => {
    setFile(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!file) {
    setError('Please select a file');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const formData = new FormData();
    formData.append('resume', file);

    console.log('Submitting form with file:', file.name);

    // Remove the token parameter since interceptor handles it
    const response = await uploadResume(formData);

    if (response.error) {
      throw new Error(response.error);
    }

    showSnackbar('Resume processed successfully!', 'success');

    // Refresh recent candidates after successful upload
    try {
      const updatedCandidates = await getCandidates({ limit: 3 });
      if (updatedCandidates.data) {
        setRecentCandidates(updatedCandidates.data);
      }
    } catch (fetchError) {
      console.error('Error fetching updated candidates:', fetchError);
    }

    if (onUploadSuccess) onUploadSuccess(response.data);

  } catch (err) {
    console.error('Upload error details:', err);
    
    let errorMsg = 'Upload failed. Please try again.';

    if (err.message.includes('parsing') || err.message.includes('format') || err.message.includes('corrupted')) {
      errorMsg = 'The resume format is not supported or is corrupted. Try a different file.';
    } else if (err.message.includes('candidate data') || err.message.includes('extract')) {
      errorMsg = 'We couldn\'t extract enough information from this resume. Please check the content.';
    } else if (err.response?.data?.message) {
      errorMsg = err.response.data.message;
    } else if (err.message) {
      errorMsg = err.message;
    }

    setError(errorMsg);
    showSnackbar(errorMsg, 'error');
  } finally {
    setLoading(false);
  }
};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl p-6 mx-auto"
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden bg-white border border-gray-100 shadow-lg rounded-xl">
            <div className="p-6 text-white bg-gradient-to-r from-blue-600 to-indigo-700">
              <h2 className="text-2xl font-bold">Upload Candidate Resume</h2>
              <p className="mt-2 text-blue-100">
                Upload resumes in PDF or DOCX format. Our AI will extract and analyze the content.
              </p>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <FiUpload className="text-xl text-blue-600" />
                    </div>
                    <p className="text-lg font-medium text-gray-700">
                      {fileName ? fileName : 'Drag & drop your file here'}
                    </p>
                    <p className="text-sm text-gray-500">
                      or click to browse files
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      Supported formats: PDF, DOCX (Max 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                  />
                </div>

                {fileName && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <FiCheck className="text-green-600" />
                      </div>
                      <span className="max-w-xs font-medium text-gray-700 truncate">
                        {fileName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-2 text-gray-500 transition-colors hover:text-red-500"
                    >
                      <FiX />
                    </button>
                  </motion.div>
                )}

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-start p-3 space-x-2 text-red-700 border border-red-200 rounded-lg bg-red-50"
                    >
                      <div className="pt-0.5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">Upload Error</p>
                        <p className="text-sm">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-end pt-4 space-x-3 border-t border-gray-100">
                  <motion.button
                    type="button"
                    onClick={() => navigate('/home')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                    disabled={loading}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || !file}
                    className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors flex items-center ${loading || !file ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {loading ? (
                      <>
                        <FiLoader className="mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiUpload className="mr-2" />
                        Upload Resume
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-3">
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h3 className="flex items-center font-medium text-gray-800">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                What we extract
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="mr-1 text-green-500">•</span> Contact information
                </li>
                <li className="flex items-start">
                  <span className="mr-1 text-green-500">•</span> Work experience
                </li>
                <li className="flex items-start">
                  <span className="mr-1 text-green-500">•</span> Education history
                </li>
                <li className="flex items-start">
                  <span className="mr-1 text-green-500">•</span> Technical skills
                </li>
              </ul>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h3 className="flex items-center font-medium text-gray-800">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Smart matching
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Our AI will automatically match candidates to open positions based on their skills and experience.
              </p>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h3 className="flex items-center font-medium text-gray-800">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                Secure storage
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                All resumes are stored securely with encryption and access controls to protect candidate data.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky overflow-hidden bg-white border border-gray-100 shadow-lg rounded-xl top-6">
            <div className="p-6 text-white bg-gradient-to-r from-blue-600 to-indigo-700">
              <h2 className="flex items-center text-xl font-bold">
                <FiUsers className="mr-2" />
                Recent Candidates
              </h2>
            </div>

            <div className="p-4">
              {recentCandidates.length > 0 ? (
                <ul className="space-y-3">
                  {recentCandidates.map((candidate) => (
                    <motion.li
                      key={candidate._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="p-3 transition-colors border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                            <span className="font-medium text-blue-600">
                              {candidate.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {candidate.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {candidate.email}
                          </p>
                        </div>
                      </div>
                      {candidate.skills && candidate.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {candidate.skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded">
                              {skill}
                            </span>
                          ))}
                          {candidate.skills.length > 3 && (
                            <span className="px-2 py-1 text-xs text-gray-800 bg-gray-100 rounded">
                              +{candidate.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </motion.li>
                  ))}
                  <div className='items-center justify-center text-center'>
                    <Link to="/candidates">
                    <button className='font-bold text-sky-600 hover:text-sky-700 hover:underline'>View All Candidates</button>
                  </Link>
                  </div>
                </ul>
              ) : (
                <div className="py-6 text-center text-gray-500">
                  <p>No candidates uploaded yet</p>
                  <p className="mt-1 text-sm">Upload resumes to see them here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ResumeUpload;

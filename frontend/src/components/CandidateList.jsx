import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiDownload,
  FiStar,
  FiAward,
  FiBriefcase,
  FiMail,
  FiPhone,
  FiBook,
  FiUser,
  FiClock,
  FiLoader,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import { getCandidates } from '../services/api';

const CandidateList = ({ token, reloadKey, limit }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCandidate, setExpandedCandidate] = useState(null);
  const [downloadStates, setDownloadStates] = useState({});
  const [fileCache, setFileCache] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const response = await getCandidates(token);
        const candidatesData = Array.isArray(response.data) ? response.data : [];
        setCandidates(limit ? candidatesData.slice(0, limit) : candidatesData);
      } catch (err) {
        setError('Failed to fetch candidates. Please try again later.');
        console.error('Fetch candidates error:', err.response?.data || err.message);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [token, reloadKey, limit]);

  // Advanced file download with caching and state management
  const handleAdvancedDownload = useCallback(async (candidate) => {
    const candidateId = candidate._id;
    const fileName = `${candidate.name.replace(/\s+/g, '_')}_Resume`;
    
    if (!candidate.resumePath) {
      setDownloadStates(prev => ({
        ...prev,
        [candidateId]: { 
          status: 'error', 
          progress: 0, 
          message: 'No resume available for this candidate' 
        }
      }));
      
      setTimeout(() => {
        setDownloadStates(prev => {
          const newState = { ...prev };
          delete newState[candidateId];
          return newState;
        });
      }, 3000);
      return;
    }
    
    try {
      // Set loading state
      setDownloadStates(prev => ({
        ...prev,
        [candidateId]: { status: 'fetching', progress: 0, message: 'Fetching resume...' }
      }));

      // Check if file is already cached in memory
      let fileBlob;
      if (fileCache[candidateId]) {
        fileBlob = fileCache[candidateId];
        setDownloadStates(prev => ({
          ...prev,
          [candidateId]: { status: 'processing', progress: 50, message: 'Retrieved from cache...' }
        }));
      } else {
        // Check localStorage first
        const storageKey = `resume_${candidateId}`;
        const storedResume = localStorage.getItem(storageKey);
        
        if (storedResume) {
          // Convert base64 back to blob
          const response = await fetch(storedResume);
          fileBlob = await response.blob();
          
          // Cache in memory too
          setFileCache(prev => ({
            ...prev,
            [candidateId]: fileBlob
          }));
          
          setDownloadStates(prev => ({
            ...prev,
            [candidateId]: { status: 'processing', progress: 40, message: 'Retrieved from storage...' }
          }));
        } else {
          // Fetch the file from server
          const response = await fetch(candidate.resumePath, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,*/*'
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch resume: ${response.statusText}`);
          }

          fileBlob = await response.blob();
          
          setDownloadStates(prev => ({
            ...prev,
            [candidateId]: { status: 'processing', progress: 30, message: 'File fetched successfully...' }
          }));
          
          // Convert blob to base64 for localStorage storage
          const reader = new FileReader();
          const base64Promise = new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
          });
          
          reader.readAsDataURL(fileBlob);
          const base64Data = await base64Promise;
          
          // Store in localStorage
          localStorage.setItem(storageKey, base64Data);
          
          // Cache in memory
          setFileCache(prev => ({
            ...prev,
            [candidateId]: fileBlob
          }));
        }
      }

      setDownloadStates(prev => ({
        ...prev,
        [candidateId]: { status: 'converting', progress: 70, message: 'Processing file format...' }
      }));

      // Determine file type and set appropriate extension
      const fileType = fileBlob.type;
      let finalFileName = fileName;
      
      if (fileType === 'application/pdf') {
        finalFileName = `${fileName}.pdf`;
      } else if (fileType.includes('word') || fileType.includes('document')) {
        finalFileName = `${fileName}.doc`;
      } else {
        finalFileName = `${fileName}.pdf`;
      }

      setDownloadStates(prev => ({
        ...prev,
        [candidateId]: { status: 'downloading', progress: 90, message: 'Preparing download...' }
      }));

      // Create download link and trigger download
      const downloadUrl = URL.createObjectURL(fileBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = finalFileName;
      downloadLink.style.display = 'none';
      
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Clean up object URL
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

      // Success state
      setDownloadStates(prev => ({
        ...prev,
        [candidateId]: { status: 'success', progress: 100, message: 'Download completed!' }
      }));

      // Clear success state after 3 seconds
      setTimeout(() => {
        setDownloadStates(prev => {
          const newState = { ...prev };
          delete newState[candidateId];
          return newState;
        });
      }, 3000);

    } catch (error) {
      console.error('Download error:', error);
      setDownloadStates(prev => ({
        ...prev,
        [candidateId]: { 
          status: 'error', 
          progress: 0, 
          message: error.message || 'Download failed' 
        }
      }));

      // Clear error state after 5 seconds
      setTimeout(() => {
        setDownloadStates(prev => {
          const newState = { ...prev };
          delete newState[candidateId];
          return newState;
        });
      }, 5000);
    }
  }, [token, fileCache]);

  const toggleCandidateExpand = (id) => {
    setExpandedCandidate(expandedCandidate === id ? null : id);
  };

  const handleNameClick = (id, e) => {
    e.stopPropagation();
    navigate(`/candidates/${id}`);
  };

  const getMatchColor = (score) => {
    if (score >= 80) return 'bg-gradient-to-r from-green-400 to-emerald-500';
    if (score >= 60) return 'bg-gradient-to-r from-amber-400 to-yellow-500';
    if (score >= 40) return 'bg-gradient-to-r from-orange-400 to-amber-500';
    return 'bg-gradient-to-r from-red-400 to-pink-500';
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-purple-100 text-purple-800';
      case 'interviewed': return 'bg-yellow-100 text-yellow-800';
      case 'hired': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderDownloadButton = (candidate) => {
    const candidateId = candidate._id;
    const downloadState = downloadStates[candidateId];

    if (!downloadState) {
      return (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAdvancedDownload(candidate);
          }}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white transition-all duration-200 transform bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:scale-105"
        >
          <FiDownload className="mr-2" />
          Download Resume/CV
        </button>
      );
    }

    const getButtonStyle = () => {
      switch (downloadState.status) {
        case 'fetching':
        case 'processing':
        case 'converting':
        case 'downloading':
          return 'bg-indigo-600 cursor-not-allowed';
        case 'success':
          return 'bg-green-600 cursor-default';
        case 'error':
          return 'bg-red-600 cursor-pointer hover:bg-red-700';
        default:
          return 'bg-blue-600';
      }
    };

    const getIcon = () => {
      switch (downloadState.status) {
        case 'fetching':
        case 'processing':
        case 'converting':
        case 'downloading':
          return <FiLoader className="mr-2 animate-spin" />;
        case 'success':
          return <FiCheckCircle className="mr-2" />;
        case 'error':
          return <FiAlertCircle className="mr-2" />;
        default:
          return <FiDownload className="mr-2" />;
      }
    };

    return (
      <div className="space-y-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (downloadState.status === 'error') {
              handleAdvancedDownload(candidate);
            }
          }}
          disabled={['fetching', 'processing', 'converting', 'downloading', 'success'].includes(downloadState.status)}
          className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ${getButtonStyle()}`}
        >
          {getIcon()}
          {downloadState.status === 'error' ? 'Retry Download' : 
           downloadState.status === 'success' ? 'Downloaded!' : 
           'Processing...'}
        </button>
        
        {downloadState.progress > 0 && (
          <div className="w-full">
            <div className="flex justify-between mb-1 text-xs text-gray-600">
              <span>{downloadState.message}</span>
              <span>{downloadState.progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${downloadState.progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-2 bg-blue-600 rounded-full"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 text-red-600 rounded-lg bg-red-50"
      >
        {error}
      </motion.div>
    );
  }

  if (candidates.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8 text-center bg-white shadow-sm rounded-xl"
      >
        <div className="flex items-center justify-center w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full">
          <FiBriefcase className="text-3xl text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-700">No candidates found</h3>
        <p className="mt-1 text-gray-500">Upload resumes to see candidates appear here</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {candidates.map((candidate) => (
          <motion.div
            key={candidate._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-200 ${expandedCandidate === candidate._id ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div
              className="p-5 cursor-pointer"
              onClick={() => toggleCandidateExpand(candidate._id)}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center rounded-full w-14 h-14 bg-gradient-to-r from-blue-100 to-indigo-100">
                    <span className="text-xl font-medium text-blue-600">
                      {candidate.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-lg font-semibold text-gray-800 truncate transition-colors duration-200 cursor-pointer hover:text-blue-600 hover:underline"
                      onClick={(e) => handleNameClick(candidate._id, e)}
                    >
                      {candidate.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {candidate.isTopCandidate && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <FiStar className="mr-1" /> Top
                        </span>
                      )}
                      {candidate.status && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                          {candidate.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center mt-1 text-sm text-gray-600">
                    <FiMail className="mr-1.5 flex-shrink-0" />
                    <span className="truncate">{candidate.email}</span>
                  </div>
                  <div className="flex items-center mt-1 text-sm text-gray-600">
                    <FiPhone className="mr-1.5 flex-shrink-0" />
                    <span>{candidate.phone}</span>
                  </div>
                </div>
              </div>

              {/* Quick Info Bar */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                {candidate.education?.[0]?.degree && (
                  <div className="flex items-center text-gray-600">
                    <FiBook className="mr-1.5 flex-shrink-0" />
                    <span>{candidate.education[0].degree}</span>
                  </div>
                )}
                {candidate.experience?.[0] && (
                  <div className="flex items-center text-gray-600">
                    <FiBriefcase className="mr-1.5 flex-shrink-0" />
                    <span>{candidate.experience[0].jobTitle}</span>
                  </div>
                )}
                {candidate.experience?.[0]?.duration && (
                  <div className="flex items-center text-gray-600">
                    <FiClock className="mr-1.5 flex-shrink-0" />
                    <span>{candidate.experience[0].duration}</span>
                  </div>
                )}
              </div>

              {candidate.skills?.length > 0 && (
                <div className="mt-4">
                  <h4 className="mb-2 text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Key Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.slice(0, 5).map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.skills.length > 5 && (
                      <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                        +{candidate.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence>
              {expandedCandidate === candidate._id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 border-t border-gray-100">
                    {/* Education Section */}
                    {candidate.education?.length > 0 && (
                      <div className="mt-6">
                        <h4 className="flex items-center mb-3 text-sm font-medium text-gray-700">
                          <FiBook className="mr-2 text-gray-500" />
                          Education
                        </h4>
                        <div className="space-y-3">
                          {candidate.education.map((edu, i) => (
                            <div key={i} className="relative pl-6">
                              <div className="absolute left-0 w-3 h-3 bg-blue-200 border-4 rounded-full top-1 border-blue-50"></div>
                              <h5 className="font-medium text-gray-800">
                                {edu.degree} at {edu.institution}
                              </h5>
                              {edu.year && (
                                <p className="text-sm text-gray-500">{edu.year}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience Section */}
                    {candidate.experience?.length > 0 && (
                      <div className="mt-6">
                        <h4 className="flex items-center mb-3 text-sm font-medium text-gray-700">
                          <FiBriefcase className="mr-2 text-gray-500" />
                          Professional Experience
                        </h4>
                        <div className="space-y-3">
                          {candidate.experience.map((exp, i) => (
                            <div key={i} className="relative pl-6">
                              <div className="absolute left-0 w-3 h-3 bg-blue-200 border-4 rounded-full top-1 border-blue-50"></div>
                              <h5 className="font-medium text-gray-800">
                                {exp.jobTitle} at {exp.company}
                              </h5>
                              <p className="text-sm text-gray-500">{exp.duration}</p>
                              {exp.description && (
                                <p className="mt-1 text-sm text-gray-600">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status Section */}
                    <div className="mt-6">
                      <h4 className="flex items-center mb-3 text-sm font-medium text-gray-700">
                        <FiUser className="mr-2 text-gray-500" />
                        Candidate Status
                      </h4>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(candidate.status)}`}>
                        {candidate.status || 'Not specified'}
                      </span>
                    </div>

                    {/* Role Compatibility Section */}
                    {candidate.roleMatchScores?.filter(match => match.roleId).length > 0 ? (
                      <div className="mt-6">
                        <h4 className="flex items-center mb-3 text-sm font-medium text-gray-700">
                          <FiAward className="mr-2 text-gray-500" />
                          Role Compatibility
                        </h4>
                        <div className="space-y-4">
                          {candidate.roleMatchScores
                            .filter(match => match.roleId)
                            .map((match, i) => (
                              <div key={i} className="p-4 rounded-lg bg-gray-50">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-medium text-gray-800">
                                    {match.roleId?.title || 'Unknown Role'}
                                  </h5>
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getMatchColor(match.score)}`}>
                                    {match.score}%
                                  </span>
                                </div>
                                <div className="w-full h-2 overflow-hidden bg-gray-200 rounded-full">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${match.score}%` }}
                                    transition={{ duration: 1, delay: 0.2 }}
                                    className={`h-2 rounded-full ${getMatchColor(match.score)}`}
                                  />
                                </div>
                                {match.explanation && (
                                  <p className="mt-2 text-sm text-gray-600">{match.explanation}</p>
                                )}
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 mt-6 text-sm text-center text-gray-500 rounded-lg bg-gray-50">
                        No active role matches found
                      </div>
                    )}

                    {/* Advanced Download Section */}
                    {candidate.resumePath && (
                      <div className="mt-6">
                        {renderDownloadButton(candidate)}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

CandidateList.defaultProps = {
  limit: null,
};

export default CandidateList;
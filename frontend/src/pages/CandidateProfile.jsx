import { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiDownload, FiMail, FiPhone, FiBriefcase, FiAward,
  FiUser, FiTag, FiEdit, FiSave, FiChevronLeft, FiX,
  FiTrash2, FiXCircle, FiMessageSquare, FiPlus, FiMinus,
  FiCalendar, FiMapPin, FiGlobe, FiLinkedin, FiGithub,
  FiLoader, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';
import { useSnackbar } from '../context/SnackbarContext';
import {
  getCandidateById, addTagToCandidate, removeTagFromCandidate,
  updateCandidateStatus, addNoteToCandidate, updateNoteForCandidate,
  deleteNoteFromCandidate
} from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import MobileHeader from '../components/Layout/MobileHeader';

// Constants for better organization
const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-gray-100 text-gray-800', ring: 'ring-gray-300' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'bg-blue-100 text-blue-800', ring: 'ring-blue-300' },
  { value: 'interviewed', label: 'Interviewed', color: 'bg-purple-100 text-purple-800', ring: 'ring-purple-300' },
  { value: 'hired', label: 'Hired', color: 'bg-green-100 text-green-800', ring: 'ring-green-300' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800', ring: 'ring-red-300' }
];

const COLOR_OPTIONS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Green', value: '#10b981' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' }
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

const CandidateProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { user } = useContext(AuthContext);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [downloadState, setDownloadState] = useState(null);
  const [fileCache, setFileCache] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    tags: true,
    notes: false,
    skills: true,
    experience: true,
    education: true,
    compatibility: true
  });

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        const response = await getCandidateById(id);
        setCandidate(response.data);
        setNewStatus(response.data.status);
      } catch (err) {
        setError('Failed to fetch candidate details');
        console.error('Error fetching candidate:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [id]);

  // Advanced file download with caching and state management
  const handleAdvancedDownload = useCallback(async () => {
    const fileName = `${candidate.name.replace(/\s+/g, '_')}_Resume`;
    
    if (!candidate.resumePath) {
      setDownloadState({ 
        status: 'error', 
        progress: 0, 
        message: 'No resume available for this candidate' 
      });
      
      setTimeout(() => {
        setDownloadState(null);
      }, 3000);
      return;
    }
    
    try {
      // Set loading state
      setDownloadState({ status: 'fetching', progress: 0, message: 'Fetching resume...' });

      // Check if file is already cached in memory
      let fileBlob;
      if (fileCache[id]) {
        fileBlob = fileCache[id];
        setDownloadState({ status: 'processing', progress: 50, message: 'Retrieved from cache...' });
      } else {
        // Check localStorage first
        const storageKey = `resume_${id}`;
        const storedResume = localStorage.getItem(storageKey);
        
        if (storedResume) {
          // Convert base64 back to blob
          const response = await fetch(storedResume);
          fileBlob = await response.blob();
          
          // Cache in memory too
          setFileCache(prev => ({
            ...prev,
            [id]: fileBlob
          }));
          
          setDownloadState({ status: 'processing', progress: 40, message: 'Retrieved from storage...' });
        } else {
          // Fetch the file from server
          const response = await fetch(candidate.resumePath, {
            headers: {
              'Authorization': `Bearer ${user?.token}`,
              'Accept': 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,*/*'
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch resume: ${response.statusText}`);
          }

          fileBlob = await response.blob();
          
          setDownloadState({ status: 'processing', progress: 30, message: 'File fetched successfully...' });
          
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
            [id]: fileBlob
          }));
        }
      }

      setDownloadState({ status: 'converting', progress: 70, message: 'Processing file format...' });

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

      setDownloadState({ status: 'downloading', progress: 90, message: 'Preparing download...' });

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
      setDownloadState({ status: 'success', progress: 100, message: 'Download completed!' });

      // Clear success state after 3 seconds
      setTimeout(() => {
        setDownloadState(null);
      }, 3000);

    } catch (error) {
      console.error('Download error:', error);
      setDownloadState({ 
        status: 'error', 
        progress: 0, 
        message: error.message || 'Download failed' 
      });

      // Clear error state after 5 seconds
      setTimeout(() => {
        setDownloadState(null);
      }, 5000);
    }
  }, [candidate, user?.token, fileCache, id]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      showSnackbar('Tag name cannot be empty', 'error');
      return;
    }

    try {
      const response = await addTagToCandidate(id, {
        name: newTagName,
        color: newTagColor
      });
      setCandidate(response.data);
      setNewTagName('');
      showSnackbar('Tag added successfully', 'success');
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to add tag', 'error');
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      const response = await removeTagFromCandidate(id, tagId);
      setCandidate(response.data);
      showSnackbar('Tag removed successfully', 'success');
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to remove tag', 'error');
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const response = await updateCandidateStatus(id, { status: newStatus });
      setCandidate(response.data);
      setIsEditingStatus(false);
      showSnackbar('Status updated successfully', 'success');
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      showSnackbar('Note cannot be empty', 'error');
      return;
    }

    try {
      const response = await addNoteToCandidate(id, { content: newNote });
      setCandidate(response.data);
      setNewNote('');
      showSnackbar('Note added successfully', 'success');
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to add note', 'error');
    }
  };

  const handleStartEditNote = (note) => {
    setEditingNoteId(note._id);
    setEditingNoteContent(note.content);
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const handleUpdateNote = async (noteId) => {
    if (!editingNoteContent.trim()) {
      showSnackbar('Note cannot be empty', 'error');
      return;
    }

    try {
      const response = await updateNoteForCandidate(id, noteId, { content: editingNoteContent });
      setCandidate(response.data);
      setEditingNoteId(null);
      setEditingNoteContent('');
      showSnackbar('Note updated successfully', 'success');
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to update note', 'error');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const response = await deleteNoteFromCandidate(id, noteId);
      setCandidate(response.data);
      showSnackbar('Note deleted successfully', 'success');
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to delete note', 'error');
    }
  };

  const getMatchColor = (score) => {
    if (score >= 80) return 'from-green-400 to-emerald-500';
    if (score >= 60) return 'from-amber-400 to-yellow-500';
    if (score >= 40) return 'from-orange-400 to-amber-500';
    return 'from-red-400 to-pink-500';
  };

  const getMatchBgColor = (score) => {
    if (score >= 80) return 'bg-green-50 border-green-100';
    if (score >= 60) return 'bg-amber-50 border-amber-100';
    if (score >= 40) return 'bg-orange-50 border-orange-100';
    return 'bg-red-50 border-red-100';
  };

  const renderDownloadButton = () => {
    if (!downloadState) {
      return (
        <button
          onClick={handleAdvancedDownload}
          className="flex items-center justify-center w-full px-4 py-3 text-white transition-all duration-200 transform bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md hover:scale-105"
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
      <div className="space-y-3">
        <button
          onClick={downloadState.status === 'error' ? handleAdvancedDownload : undefined}
          disabled={['fetching', 'processing', 'converting', 'downloading', 'success'].includes(downloadState.status)}
          className={`flex items-center justify-center w-full px-4 py-3 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ${getButtonStyle()}`}
        >
          {getIcon()}
          {downloadState.status === 'error' ? 'Retry Download' : 
           downloadState.status === 'success' ? 'Downloaded!' : 
           'Processing...'}
        </button>
        
        {downloadState.progress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{downloadState.message}</span>
              <span>{downloadState.progress}%</span>
            </div>
            <div className="w-full h-2 overflow-hidden bg-gray-200 rounded-full">
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
      <div className="flex items-center justify-center min-h-screen py-12">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 mx-4 my-6 text-red-700 bg-red-100 rounded-lg shadow-sm md:mx-0"
      >
        <div className="flex items-center">
          <FiXCircle className="mr-3 text-xl" />
          <span>{error}</span>
        </div>
        <button
          onClick={() => navigate('/candidates')}
          className="px-4 py-2 mt-4 text-white bg-red-600 rounded-lg hover:bg-red-700"
        >
          Back to Candidates
        </button>
      </motion.div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-6 mx-4 my-6 text-gray-700 bg-gray-100 rounded-lg shadow-sm md:mx-0">
        <div className="flex items-center">
          <FiXCircle className="mr-3 text-xl" />
          <span>Candidate not found</span>
        </div>
        <button
          onClick={() => navigate('/candidates')}
          className="px-4 py-2 mt-4 text-white bg-gray-600 rounded-lg hover:bg-gray-700"
        >
          Back to Candidates
        </button>
      </div>
    );
  }

  return (
    <Layout>
      <MobileHeader />
      <div className='overflow-auto bg-gray-50'>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="px-4 py-6 mx-auto space-y-6 max-w-7xl sm:px-6 lg:px-8"
        >
          {/* Header with back button */}
          <motion.div
            variants={itemVariants}
            className="flex items-center"
          >
            <h1 className="ml-4 text-2xl font-bold text-gray-900 md:text-3xl">Candidate Profile</h1>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-6 lg:grid-cols-3"
          >
            {/* Left Column - Profile Card */}
            <motion.div
              variants={cardVariants}
              className="lg:col-span-1"
            >
              <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl">
                {/* Profile Header */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <div className="flex items-center justify-center w-24 h-24 text-3xl font-bold text-white rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-indigo-600">
                        {candidate.name.charAt(0)}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full border-2 border-indigo-100 ${STATUS_OPTIONS.find(s => s.value === candidate.status)?.color}`}></div>
                    </div>
                    <h1 className="mt-4 text-xl font-bold text-gray-900">{candidate.name}</h1>
                    <p className="text-gray-600">{candidate.title}</p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="p-6">
                  <h2 className="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase">Contact Information</h2>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-10 h-10 text-blue-600 rounded-lg bg-blue-50">
                        <FiMail className="text-lg" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <a href={`mailto:${candidate.email}`} className="text-blue-600 hover:underline">
                          {candidate.email}
                        </a>
                      </div>
                    </div>

                    {candidate.phone && (
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 text-green-600 rounded-lg bg-green-50">
                          <FiPhone className="text-lg" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-500">Phone</p>
                          <a href={`tel:${candidate.phone}`} className="text-blue-600 hover:underline">
                            {candidate.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {candidate.location && (
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 text-purple-600 rounded-lg bg-purple-50">
                          <FiMapPin className="text-lg" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-500">Location</p>
                          <p className="text-gray-900">{candidate.location}</p>
                        </div>
                      </div>
                    )}

                    {candidate.linkedIn && (
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 text-blue-700 rounded-lg bg-blue-50">
                          <FiLinkedin className="text-lg" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-500">LinkedIn</p>
                          <a href={candidate.linkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Profile
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Advanced Download Section */}
                  {candidate.resumePath && (
                    <div className="mt-6">
                      {renderDownloadButton()}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right Column - Details */}
            <motion.div
              variants={cardVariants}
              className="space-y-6 lg:col-span-2"
            >
              {/* Status Card */}
              <motion.div
                variants={itemVariants}
                className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl"
              >
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-800">Application Status</h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`px-4 py-2 rounded-full ${STATUS_OPTIONS.find(s => s.value === candidate.status)?.color} ${STATUS_OPTIONS.find(s => s.value === candidate.status)?.ring} ring-1`}>
                        {STATUS_OPTIONS.find(s => s.value === candidate.status)?.label || candidate.status}
                      </div>
                    </div>

                    {user?.role !== 'viewer' && (
                      <button
                        onClick={() => setIsEditingStatus(!isEditingStatus)}
                        className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 transition-colors duration-200 rounded-lg bg-blue-50 hover:bg-blue-100"
                      >
                        {isEditingStatus ? (
                          <>
                            <FiX className="mr-1" /> Cancel
                          </>
                        ) : (
                          <>
                            <FiEdit className="mr-1" /> Edit Status
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {isEditingStatus && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4"
                    >
                      <div className="flex items-center space-x-3">
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleStatusUpdate}
                          className="px-4 py-2 text-white transition-colors duration-200 bg-green-600 rounded-lg hover:bg-green-700"
                        >
                          <FiSave className="inline mr-1" /> Save
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Tags Section */}
              <motion.div
                variants={itemVariants}
                className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-800">Tags</h2>
                  <button
                    onClick={() => toggleSection('tags')}
                    className="p-1 text-gray-500 rounded-lg hover:text-gray-700"
                  >
                    {expandedSections.tags ? <FiMinus /> : <FiPlus />}
                  </button>
                </div>

                <AnimatePresence>
                  {expandedSections.tags && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-6"
                    >
                      {candidate.tags?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {candidate.tags.map((tag) => (
                            <motion.div
                              key={tag._id}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="flex items-center px-3 py-1.5 text-sm rounded-full shadow-sm"
                              style={{ backgroundColor: `${tag.color}15`, color: tag.color, border: `1px solid ${tag.color}30` }}
                            >
                              {tag.name}
                              {(user?.role === 'admin' || tag.addedBy === user?.id) && (
                                <button
                                  onClick={() => handleRemoveTag(tag._id)}
                                  className="ml-2 transition-opacity duration-200 hover:opacity-70"
                                  aria-label={`Remove tag ${tag.name}`}
                                >
                                  <FiX size={14} />
                                </button>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No tags added yet.</p>
                      )}

                      {user?.role !== 'viewer' && (
                        <div className="pt-6 mt-6 border-t border-gray-100">
                          <h3 className="mb-3 text-sm font-medium text-gray-700">Add New Tag</h3>
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                              type="text"
                              value={newTagName}
                              onChange={(e) => setNewTagName(e.target.value)}
                              placeholder="Tag name"
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                            />
                            <select
                              value={newTagColor}
                              onChange={(e) => setNewTagColor(e.target.value)}
                              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {COLOR_OPTIONS.map((color) => (
                                <option key={color.value} value={color.value}>
                                  {color.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={handleAddTag}
                              disabled={!newTagName.trim()}
                              className={`px-4 py-2 rounded-lg transition-all duration-200 ${!newTagName.trim()
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                                }`}
                            >
                              Add Tag
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Notes Section */}
              <motion.div
                variants={itemVariants}
                className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-800">Notes</h2>
                  <button
                    onClick={() => toggleSection('notes')}
                    className="p-1 text-gray-500 rounded-lg hover:text-gray-700"
                  >
                    {expandedSections.notes ? <FiMinus /> : <FiPlus />}
                  </button>
                </div>

                <AnimatePresence>
                  {expandedSections.notes && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-6"
                    >
                      {candidate.notes?.length > 0 ? (
                        <div className="space-y-4">
                          {candidate.notes.map((note, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                            >
                              {editingNoteId === note._id ? (
                                <div className="space-y-3">
                                  <textarea
                                    value={editingNoteContent}
                                    onChange={(e) => setEditingNoteContent(e.target.value)}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    autoFocus
                                  />
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleUpdateNote(note._id)}
                                      className="px-3 py-1.5 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors duration-200"
                                    >
                                      <FiSave className="inline mr-1" /> Save
                                    </button>
                                    <button
                                      onClick={handleCancelEditNote}
                                      className="px-3 py-1.5 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                    >
                                      <FiXCircle className="inline mr-1" /> Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200">
                                    <div className="text-xs text-gray-500">
                                      <span className="font-medium">{note.addedBy?.firstName || 'Unknown'}</span>
                                      <span className="mx-2">•</span>
                                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {(user?.role === 'admin' || note.addedBy === user?.id) && (
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => handleStartEditNote(note)}
                                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                                          aria-label="Edit note"
                                        >
                                          <FiEdit size={14} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteNote(note._id)}
                                          className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                                          aria-label="Delete note"
                                        >
                                          <FiTrash2 size={14} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No notes yet.</p>
                      )}

                      {user?.role !== 'viewer' && editingNoteId === null && (
                        <div className="pt-6 mt-6 border-t border-gray-200">
                          <h3 className="mb-3 text-sm font-medium text-gray-700">Add Note</h3>
                          <div className="flex flex-col gap-3">
                            <textarea
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              placeholder="Add your note here..."
                              rows="3"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              onClick={handleAddNote}
                              disabled={!newNote.trim()}
                              className={`self-end px-4 py-2 rounded-lg transition-all duration-200 ${!newNote.trim()
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                                }`}
                            >
                              Add Note
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Skills Section */}
              {candidate.skills?.length > 0 && (
                <motion.div
                  variants={itemVariants}
                  className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl"
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="flex items-center text-lg font-semibold text-gray-800">
                      <FiAward className="mr-2" />
                      Skills
                    </h2>
                    <button
                      onClick={() => toggleSection('skills')}
                      className="p-1 text-gray-500 rounded-lg hover:text-gray-700"
                    >
                      {expandedSections.skills ? <FiMinus /> : <FiPlus />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {expandedSections.skills && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="p-6"
                      >
                        <div className="flex flex-wrap gap-2">
                          {candidate.skills.map((skill, index) => (
                            <motion.span
                              key={index}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className="px-3 py-1.5 text-sm font-medium text-blue-800 bg-blue-100 rounded-full shadow-sm"
                            >
                              {skill}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Experience Section */}
              {candidate.experience?.length > 0 && (
                <motion.div
                  variants={itemVariants}
                  className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl"
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="flex items-center text-lg font-semibold text-gray-800">
                      <FiBriefcase className="mr-2" />
                      Professional Experience
                    </h2>
                    <button
                      onClick={() => toggleSection('experience')}
                      className="p-1 text-gray-500 rounded-lg hover:text-gray-700"
                    >
                      {expandedSections.experience ? <FiMinus /> : <FiPlus />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {expandedSections.experience && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="p-6"
                      >
                        <div className="space-y-6">
                          {candidate.experience.map((exp, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="relative pl-10"
                            >
                              <div className="absolute left-0 w-6 h-6 bg-blue-100 border-4 border-white rounded-full top-1 ring-2 ring-blue-200"></div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {exp.jobTitle} at {exp.company}
                              </h3>
                              <div className="flex items-center mt-1 text-sm text-gray-500">
                                <FiCalendar className="mr-1.5" />
                                <span>{exp.duration}</span>
                              </div>
                              {exp.description && (
                                <p className="mt-2 text-gray-600">{exp.description}</p>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Education Section */}
              {candidate.education?.length > 0 && (
                <motion.div
                  variants={itemVariants}
                  className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl"
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="flex items-center text-lg font-semibold text-gray-800">
                      <FiUser className="mr-2" />
                      Education
                    </h2>
                    <button
                      onClick={() => toggleSection('education')}
                      className="p-1 text-gray-500 rounded-lg hover:text-gray-700"
                    >
                      {expandedSections.education ? <FiMinus /> : <FiPlus />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {expandedSections.education && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="p-6"
                      >
                        <div className="space-y-6">
                          {candidate.education.map((edu, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="relative pl-10"
                            >
                              <div className="absolute left-0 w-6 h-6 bg-green-100 border-4 border-white rounded-full top-1 ring-2 ring-green-200"></div>
                              <h3 className="text-lg font-medium text-gray-900">{edu.degree}</h3>
                              <p className="text-gray-600">{edu.institution}</p>
                              {edu.year && (
                                <div className="flex items-center mt-1 text-sm text-gray-500">
                                  <FiCalendar className="mr-1.5" />
                                  <span>Graduated: {edu.year}</span>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Role Compatibility Section */}
              {candidate.roleMatchScores?.length > 0 && (
                <motion.div
                  variants={itemVariants}
                  className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl"
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="flex items-center text-lg font-semibold text-gray-800">
                      <FiAward className="mr-2" />
                      Role Compatibility
                    </h2>
                    <button
                      onClick={() => toggleSection('compatibility')}
                      className="p-1 text-gray-500 rounded-lg hover:text-gray-700"
                    >
                      {expandedSections.compatibility ? <FiMinus /> : <FiPlus />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {expandedSections.compatibility && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="p-6"
                      >
                        <div className="space-y-6">
                          {candidate.roleMatchScores.map((match, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`p-4 rounded-lg border ${getMatchBgColor(match.score)}`}
                            >
                              <div className="flex items-start justify-between">
                                <h3 className="font-medium text-gray-800">
                                  {match.roleId?.title || 'Unknown Role'}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getMatchColor(match.score)} shadow-sm`}>
                                  {match.score}%
                                </span>
                              </div>
                              <div className="w-full h-2.5 mt-3 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${match.score}%` }}
                                  transition={{ duration: 1, delay: index * 0.2 }}
                                  className={`h-full rounded-full bg-gradient-to-r ${getMatchColor(match.score)}`}
                                />
                              </div>
                              {match.explanation && (
                                <p className="mt-3 text-sm text-gray-600">{match.explanation}</p>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default CandidateProfile;


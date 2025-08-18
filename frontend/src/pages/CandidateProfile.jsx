import { useState, useEffect, useContext } from 'react'; // Added useContext
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiDownload, 
  FiMail, 
  FiPhone, 
  FiBriefcase, 
  FiAward, 
  FiUser, 
  FiTag,
  FiEdit2,
  FiTrash2,
  FiChevronLeft,
  FiX // Added missing import
} from 'react-icons/fi';
import { useSnackbar } from '../context/SnackbarContext';
import { getCandidateById, addTagToCandidate, removeTagFromCandidate, updateCandidateStatus } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const CandidateProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { user } = useContext(AuthContext); // Changed to useContext
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const statusOptions = [
    { value: 'new', label: 'New', color: 'bg-gray-100 text-gray-800' },
    { value: 'shortlisted', label: 'Shortlisted', color: 'bg-blue-100 text-blue-800' },
    { value: 'interviewed', label: 'Interviewed', color: 'bg-purple-100 text-purple-800' },
    { value: 'hired', label: 'Hired', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' }
  ];

  const colorOptions = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Green', value: '#10b981' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Indigo', value: '#6366f1' }
  ];

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

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const response = await addTagToCandidate(id, {
        name: newTagName,
        color: newTagColor
      });
      setCandidate(response.data);
      setNewTagName('');
      showSnackbar('Tag added successfully', 'success');
    } catch (error) {
      showSnackbar(error.message || 'Failed to add tag', 'error');
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      const response = await removeTagFromCandidate(id, tagId);
      setCandidate(response.data);
      showSnackbar('Tag removed successfully', 'success');
    } catch (error) {
      showSnackbar(error.message || 'Failed to remove tag', 'error');
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const response = await updateCandidateStatus(id, { status: newStatus });
      setCandidate(response.data);
      setIsEditingStatus(false);
      showSnackbar('Status updated successfully', 'success');
    } catch (error) {
      showSnackbar(error.message || 'Failed to update status', 'error');
    }
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
      <div className="p-4 text-red-600 bg-red-100 rounded-lg">
        {error}
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-4 text-gray-600 bg-gray-100 rounded-lg">
        Candidate not found
      </div>
    );
  }

  const getMatchColor = (score) => {
    if (score >= 80) return 'bg-gradient-to-r from-green-400 to-emerald-500';
    if (score >= 60) return 'bg-gradient-to-r from-amber-400 to-yellow-500';
    if (score >= 40) return 'bg-gradient-to-r from-orange-400 to-amber-500';
    return 'bg-gradient-to-r from-red-400 to-pink-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-600 hover:text-blue-800"
      >
        <FiChevronLeft className="mr-1" />
        Back to candidates
      </button>

      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex flex-col justify-between md:flex-row md:items-start">
          <div className="flex items-start space-x-4">
            <div className="flex items-center justify-center w-16 h-16 text-2xl font-bold text-white bg-blue-600 rounded-full">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{candidate.name}</h1>
              <div className="flex items-center mt-1 text-gray-600">
                <FiMail className="mr-2" />
                <a href={`mailto:${candidate.email}`} className="hover:text-blue-600">
                  {candidate.email}
                </a>
              </div>
              {candidate.phone && (
                <div className="flex items-center mt-1 text-gray-600">
                  <FiPhone className="mr-2" />
                  <a href={`tel:${candidate.phone}`} className="hover:text-blue-600">
                    {candidate.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="flex mt-4 space-x-3 md:mt-0">
            {candidate.resumePath && (
              <a
                href={`http://localhost:5000${candidate.resumePath}`}
                download
                className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <FiDownload className="mr-2" />
                Download Resume
              </a>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-800">Current Status</h2>
            {user?.role !== 'viewer' && ( // Added optional chaining
              <button
                onClick={() => setIsEditingStatus(!isEditingStatus)}
                className="text-sm text-blue-600 hover:underline"
              >
                {isEditingStatus ? 'Cancel' : 'Edit Status'}
              </button>
            )}
          </div>

          {isEditingStatus ? (
            <div className="flex items-center mt-2 space-x-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="mt-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusOptions.find(s => s.value === candidate.status)?.color || 'bg-gray-100 text-gray-800'}`}>
                {statusOptions.find(s => s.value === candidate.status)?.label || candidate.status}
              </span>
            </div>
          )}
        </div>

        {candidate.tags?.length > 0 && (
          <div className="mt-6">
            <h2 className="flex items-center text-lg font-medium text-gray-800">
              <FiTag className="mr-2" />
              Tags
            </h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {candidate.tags.map((tag) => (
                <div
                  key={tag._id}
                  className="flex items-center px-3 py-1 text-sm rounded-full"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                >
                  {tag.name}
                  {(user?.role === 'admin' || tag.addedBy === user?.id) && ( // Added optional chaining
                    <button
                      onClick={() => handleRemoveTag(tag._id)}
                      className="ml-2 hover:opacity-70"
                    >
                      <FiX size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {user?.role !== 'viewer' && ( // Added optional chaining
          <div className="mt-6">
            <h2 className="text-lg font-medium text-gray-800">Add New Tag</h2>
            <div className="flex items-center mt-2 space-x-3">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <select
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                {colorOptions.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddTag}
                disabled={!newTagName.trim()}
                className={`px-4 py-2 text-white rounded-md ${!newTagName.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                Add Tag
              </button>
            </div>
          </div>
        )}

        {/* Rest of the component remains the same */}
        {candidate.skills?.length > 0 && (
          <div className="mt-6">
            <h2 className="flex items-center text-lg font-medium text-gray-800">
              <FiAward className="mr-2" />
              Skills
            </h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {candidate.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm text-blue-800 bg-blue-100 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {candidate.experience?.length > 0 && (
          <div className="mt-6">
            <h2 className="flex items-center text-lg font-medium text-gray-800">
              <FiBriefcase className="mr-2" />
              Professional Experience
            </h2>
            <div className="mt-4 space-y-4">
              {candidate.experience.map((exp, index) => (
                <div key={index} className="relative pl-6">
                  <div className="absolute left-0 w-3 h-3 bg-blue-200 border-4 rounded-full top-1 border-blue-50"></div>
                  <h3 className="font-medium text-gray-800">
                    {exp.jobTitle} at {exp.company}
                  </h3>
                  <p className="text-sm text-gray-500">{exp.duration}</p>
                  {exp.description && (
                    <p className="mt-1 text-sm text-gray-600">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {candidate.education?.length > 0 && (
          <div className="mt-6">
            <h2 className="flex items-center text-lg font-medium text-gray-800">
              <FiUser className="mr-2" />
              Education
            </h2>
            <div className="mt-4 space-y-4">
              {candidate.education.map((edu, index) => (
                <div key={index} className="relative pl-6">
                  <div className="absolute left-0 w-3 h-3 bg-blue-200 border-4 rounded-full top-1 border-blue-50"></div>
                  <h3 className="font-medium text-gray-800">{edu.degree}</h3>
                  <p className="text-sm text-gray-500">{edu.institution}</p>
                  {edu.year && (
                    <p className="text-sm text-gray-500">Graduated: {edu.year}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {candidate.roleMatchScores?.length > 0 && (
          <div className="mt-6">
            <h2 className="flex items-center text-lg font-medium text-gray-800">
              <FiAward className="mr-2" />
              Role Compatibility
            </h2>
            <div className="mt-4 space-y-4">
              {candidate.roleMatchScores.map((match, index) => (
                <div key={index} className="p-4 rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-800">
                      {match.roleId?.title || 'Unknown Role'}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getMatchColor(match.score)}`}>
                      {match.score}%
                    </span>
                  </div>
                  <div className="w-full h-2 mt-2 bg-gray-200 rounded-full">
                    <div
                      className={`h-2 rounded-full ${getMatchColor(match.score)}`}
                      style={{ width: `${match.score}%` }}
                    ></div>
                  </div>
                  {match.explanation && (
                    <p className="mt-2 text-sm text-gray-600">{match.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CandidateProfile;
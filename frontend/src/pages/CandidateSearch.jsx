import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiX,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiUser,
  FiBriefcase,
  FiAward,
  FiStar,
  FiMail,
  FiPhone,
  FiBook,
  FiClock
} from 'react-icons/fi';
import { getCandidates } from '../services/api';
import SkillBadge from '../components/SkillBadge';
import Layout from '../components/Layout/Layout';
import MobileHeader from '../components/Layout/MobileHeader';

const CandidateSearch = ({ token }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState({
    candidates: [],
    loading: true,
    error: '',
    searchTerm: '',
    filters: {
      skills: [],
      minScore: null,
      experienceMin: null,
      experienceMax: null,
      education: '',
      status: ''
    },
    showFilters: false,
    newSkill: '',
    availableSkills: [],
    expandedCandidate: null
  });

  // Initialize filters from URL
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    setState(prev => ({
      ...prev,
      searchTerm: query.get('search') || '',
      filters: {
        skills: query.get('skills') ? query.get('skills').split(',') : [],
        minScore: query.get('minScore') || null,
        experienceMin: query.get('expMin') || null,
        experienceMax: query.get('expMax') || null,
        education: query.get('education') || '',
        status: query.get('status') || ''
      }
    }));
    fetchAvailableSkills();
  }, [location.search]);

  // Fetch candidates when filters change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));

        const params = {
          search: state.searchTerm,
          skills: state.filters.skills.join(','),
          minScore: state.filters.minScore,
          expMin: state.filters.experienceMin,
          expMax: state.filters.experienceMax,
          education: state.filters.education,
          status: state.filters.status
        };

        const response = await getCandidates(params);
        setState(prev => ({
          ...prev,
          candidates: response.data || [],
          loading: false,
          error: ''
        }));
      } catch (err) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to fetch candidates. Please try again.',
          candidates: []
        }));
      }
    };

    const debounceTimer = setTimeout(fetchData, 300);
    return () => clearTimeout(debounceTimer);
  }, [state.searchTerm, state.filters, token]);

  const fetchAvailableSkills = async () => {
    try {
      const response = await getCandidates({ limit: 100 });
      const allSkills = new Set();

      response.data?.forEach(candidate => {
        candidate.skills?.forEach(skill => {
          allSkills.add(skill.toLowerCase());
        });
      });

      setState(prev => ({
        ...prev,
        availableSkills: Array.from(allSkills).sort()
      }));
    } catch (err) {
      console.error('Error fetching skills:', err);
    }
  };

  const updateURL = () => {
    const query = new URLSearchParams();

    if (state.searchTerm) query.set('search', state.searchTerm);
    if (state.filters.skills.length) query.set('skills', state.filters.skills.join(','));
    if (state.filters.minScore) query.set('minScore', state.filters.minScore);
    if (state.filters.experienceMin) query.set('expMin', state.filters.experienceMin);
    if (state.filters.experienceMax) query.set('expMax', state.filters.experienceMax);
    if (state.filters.education) query.set('education', state.filters.education);
    if (state.filters.status) query.set('status', state.filters.status);

    navigate({ search: query.toString() }, { replace: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateURL();
  };

  const handleAddSkill = (skill) => {
    if (skill && !state.filters.skills.includes(skill)) {
      setState(prev => ({
        ...prev,
        filters: {
          ...prev.filters,
          skills: [...prev.filters.skills, skill]
        },
        newSkill: ''
      }));
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        skills: prev.filters.skills.filter(skill => skill !== skillToRemove)
      }
    }));
  };

  const handleResetFilters = () => {
    setState(prev => ({
      ...prev,
      searchTerm: '',
      filters: {
        skills: [],
        minScore: null,
        experienceMin: null,
        experienceMax: null,
        education: '',
        status: ''
      }
    }));
    navigate({ search: '' }, { replace: true });
  };

  const toggleCandidateExpand = (id) => {
    setState(prev => ({
      ...prev,
      expandedCandidate: prev.expandedCandidate === id ? null : id
    }));
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

  const educationOptions = [
    'High School', 'Associate Degree', 'Bachelor\'s Degree',
    'Master\'s Degree', 'PhD', 'Diploma', 'Certificate'
  ];

  const statusOptions = [
    'All', 'New', 'Shortlisted', 'Interviewed', 'Hired', 'Rejected'
  ];

  return (
    <Layout>
      <MobileHeader />
      <div className="min-h-screen pb-10 overflow-auto bg-gray-50">   {/* 👈 Ye pura page ka background karega */}
        <div className='pt-8 pl-10'>
          <h1 className='text-3xl font-bold'>Candidates</h1>
        </div>
        <div className="px-16 pt-5 pb-10 space-y-6">
          {/* Search Bar */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={state.searchTerm}
                  onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search candidates by name, email, or skills..."
                />
                {state.searchTerm && (
                  <button
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, searchTerm: '' }))}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    <FiX />
                  </button>
                )}
              </div>

              {/* Filters Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
                  className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  <FiFilter className="mr-1" />
                  {state.showFilters ? 'Hide filters' : 'Show filters'}
                  {state.showFilters ? (
                    <FiChevronUp className="ml-1" />
                  ) : (
                    <FiChevronDown className="ml-1" />
                  )}
                </button>

                {/* Filters Panel */}
                <AnimatePresence>
                  {state.showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2 lg:grid-cols-4">
                        {/* Skills Filter */}
                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-700">
                            Skills
                          </label>
                          <div className="flex space-x-2">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={state.newSkill}
                                onChange={(e) => setState(prev => ({ ...prev, newSkill: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddSkill(state.newSkill);
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Type to search skills..."
                                list="skillSuggestions"
                              />
                              <datalist id="skillSuggestions">
                                {state.availableSkills.map(skill => (
                                  <option key={skill} value={skill} />
                                ))}
                              </datalist>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddSkill(state.newSkill)}
                              disabled={!state.newSkill.trim()}
                              className="px-3 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              Add
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {state.filters.skills.map(skill => (
                              <SkillBadge
                                key={skill}
                                skill={skill}
                                onRemove={() => handleRemoveSkill(skill)}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Match Score Filter */}
                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-700">
                            Minimum Match Score
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={state.filters.minScore || 0}
                              onChange={(e) => setState(prev => ({
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  minScore: e.target.value
                                }
                              }))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="w-12 text-sm font-medium text-gray-700">
                              {state.filters.minScore || 0}%
                            </span>
                          </div>
                        </div>

                        {/* Experience Filter */}
                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-700">
                            Experience (years)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-500">Min</label>
                              <input
                                type="number"
                                min="0"
                                value={state.filters.experienceMin || ''}
                                onChange={(e) => {
                                  const value = e.target.value ? parseInt(e.target.value) : null;
                                  setState(prev => ({
                                    ...prev,
                                    filters: {
                                      ...prev.filters,
                                      experienceMin: value
                                    }
                                  }));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500">Max</label>
                              <input
                                type="number"
                                min="0"
                                value={state.filters.experienceMax || ''}
                                onChange={(e) => {
                                  const value = e.target.value ? parseInt(e.target.value) : null;
                                  setState(prev => ({
                                    ...prev,
                                    filters: {
                                      ...prev.filters,
                                      experienceMax: value
                                    }
                                  }));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Any"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Education & Status Filters */}
                        <div className="space-y-3">
                          <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                              Education
                            </label>
                            <select
                              value={state.filters.education}
                              onChange={(e) => setState(prev => ({
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  education: e.target.value
                                }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="">Any Education</option>
                              {educationOptions.map(edu => (
                                <option key={edu} value={edu}>{edu}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                              Status
                            </label>
                            <select
                              value={state.filters.status}
                              onChange={(e) => setState(prev => ({
                                ...prev,
                                filters: {
                                  ...prev.filters,
                                  status: e.target.value
                                }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              {statusOptions.map(status => (
                                <option key={status} value={status === 'All' ? '' : status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Filter Actions */}
                      <div className="flex justify-end mt-4 space-x-3">
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                          Reset All
                        </button>
                        <button
                          type="submit"
                          onClick={handleSearch}
                          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {state.loading ? (
              <div className="flex justify-center p-8">
                <div className="w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
            ) : state.error ? (
              <div className="p-4 text-red-600 bg-red-100 rounded-lg">
                {state.error}
              </div>
            ) : state.candidates.length === 0 ? (
              <div className="p-8 text-center bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex flex-col items-center justify-center">
                  <FiUser className="w-12 h-12 mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-700">No candidates found</h3>
                  <p className="mt-1 text-gray-500">
                    {Object.values(state.filters).some(Boolean)
                      ? "Try adjusting your filters"
                      : "Upload resumes to see candidates appear here"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence>
                  {state.candidates.map((candidate) => (
                    <motion.div
                      key={candidate._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className={`bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 ${state.expandedCandidate === candidate._id ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div
                        className="p-5 cursor-pointer"
                        onClick={() => toggleCandidateExpand(candidate._id)}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center rounded-full w-14 h-14 bg-gradient-to-r from-blue-100 to-indigo-100">
                              <span className="text-xl font-medium text-blue-600">
                                {candidate.name?.charAt(0) || '?'}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3
                                className="text-lg font-semibold text-gray-800 truncate cursor-pointer hover:text-blue-600 hover:underline"
                                onClick={(e) => handleNameClick(candidate._id, e)}
                              >
                                {candidate.name || 'Unnamed Candidate'}
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
                        <div className="flex flex-wrap gap-4 mt-3 text-sm">
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
                            <h4 className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                              Key Skills
                            </h4>
                            <div className="flex flex-wrap gap-2 mt-2">
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
                        {state.expandedCandidate === candidate._id && (
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
                                <div className="mt-4">
                                  <h4 className="flex items-center text-sm font-medium text-gray-700">
                                    <FiBook className="mr-2 text-gray-500" />
                                    Education
                                  </h4>
                                  <div className="mt-3 space-y-3">
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
                                <div className="mt-4">
                                  <h4 className="flex items-center text-sm font-medium text-gray-700">
                                    <FiBriefcase className="mr-2 text-gray-500" />
                                    Professional Experience
                                  </h4>
                                  <div className="mt-3 space-y-3">
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
                              <div className="mt-4">
                                <h4 className="flex items-center text-sm font-medium text-gray-700">
                                  <FiUser className="mr-2 text-gray-500" />
                                  Candidate Status
                                </h4>
                                <div className="mt-2">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(candidate.status)}`}>
                                    {candidate.status || 'Not specified'}
                                  </span>
                                </div>
                              </div>

                              {candidate.roleMatchScores?.filter(match => match.roleId).length > 0 ? (
                                <div className="mt-6">
                                  <h4 className="flex items-center text-sm font-medium text-gray-700">
                                    <FiAward className="mr-2 text-gray-500" />
                                    Role Compatibility
                                  </h4>
                                  <div className="mt-3 space-y-4">
                                    {candidate.roleMatchScores
                                      .filter(match => match.roleId)
                                      .map((match, i) => (
                                        <div key={i} className="p-4 rounded-lg bg-gray-50">
                                          <div className="flex items-start justify-between">
                                            <h5 className="font-medium text-gray-800">
                                              {match.roleId?.title || 'Unknown Role'}
                                            </h5>
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
                                      ))
                                    }
                                  </div>
                                </div>
                              ) : (
                                <div className="p-4 mt-6 text-sm text-center text-gray-500 rounded-lg bg-gray-50">
                                  No active role matches found
                                </div>
                              )}

                              {candidate.resumePath && (
                                <div className="mt-6">
                                  <a
                                    href={`http://localhost:5000${candidate.resumePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                  >
                                    <FiDownload className="mr-2" />
                                    Download Resume
                                  </a>
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
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CandidateSearch;
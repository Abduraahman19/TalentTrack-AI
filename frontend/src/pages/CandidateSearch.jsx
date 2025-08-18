import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { getCandidates } from '../services/api';
import CandidateList from '../components/CandidateList';

const CandidateSearch = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    skills: [],
    minScore: null,
    experienceMin: null,
    experienceMax: null,
    education: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  // Parse initial filters from URL query params
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const initialFilters = {
      skills: query.get('skills') ? query.get('skills').split(',') : [],
      minScore: query.get('minScore') || null,
      experienceMin: query.get('experienceMin') || null,
      experienceMax: query.get('experienceMax') || null,
      education: query.get('education') || ''
    };
    
    setFilters(initialFilters);
    setSearchTerm(query.get('search') || '');
  }, [location.search]);

  // Fetch candidates based on current filters
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const params = {
          search: searchTerm,
          minScore: filters.minScore,
          skill: filters.skills.join(','),
          experienceMin: filters.experienceMin,
          experienceMax: filters.experienceMax,
          education: filters.education
        };
        
        const response = await getCandidates(params);
        setCandidates(response.data);
      } catch (err) {
        setError('Failed to fetch candidates. Please try again later.');
        console.error('Error fetching candidates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [searchTerm, filters]);

  const updateURL = () => {
    const query = new URLSearchParams();
    
    if (searchTerm) query.set('search', searchTerm);
    if (filters.skills.length > 0) query.set('skills', filters.skills.join(','));
    if (filters.minScore) query.set('minScore', filters.minScore);
    if (filters.experienceMin) query.set('experienceMin', filters.experienceMin);
    if (filters.experienceMax) query.set('experienceMax', filters.experienceMax);
    if (filters.education) query.set('education', filters.education);
    
    navigate({ search: query.toString() }, { replace: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateURL();
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !filters.skills.includes(newSkill.trim())) {
      setFilters({
        ...filters,
        skills: [...filters.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFilters({
      ...filters,
      skills: filters.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleResetFilters = () => {
    setFilters({
      skills: [],
      minScore: null,
      experienceMin: null,
      experienceMax: null,
      education: ''
    });
    setSearchTerm('');
    navigate({ search: '' }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search candidates by name, email, or skills..."
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                <FiX />
              </button>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <FiFilter className="mr-1" />
              {showFilters ? 'Hide filters' : 'Show filters'}
              {showFilters ? (
                <FiChevronUp className="ml-1" />
              ) : (
                <FiChevronDown className="ml-1" />
              )}
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Skills</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Add skill filter"
                        />
                        <button
                          type="button"
                          onClick={handleAddSkill}
                          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {filters.skills.map((skill) => (
                          <div key={skill} className="flex items-center px-3 py-1 text-sm bg-blue-100 rounded-full">
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <FiX size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Min Match Score</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={filters.minScore || ''}
                        onChange={(e) => setFilters({
                          ...filters,
                          minScore: e.target.value ? parseInt(e.target.value) : null
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="e.g. 70"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Experience Range</label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          min="0"
                          value={filters.experienceMin || ''}
                          onChange={(e) => setFilters({
                            ...filters,
                            experienceMin: e.target.value ? parseFloat(e.target.value) : null
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Min"
                        />
                        <input
                          type="number"
                          min="0"
                          value={filters.experienceMax || ''}
                          onChange={(e) => setFilters({
                            ...filters,
                            experienceMax: e.target.value ? parseFloat(e.target.value) : null
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Max"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Education</label>
                      <select
                        value={filters.education}
                        onChange={(e) => setFilters({
                          ...filters,
                          education: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Any</option>
                        <option value="Bachelor">Bachelor's Degree</option>
                        <option value="Master">Master's Degree</option>
                        <option value="PhD">PhD</option>
                        <option value="Diploma">Diploma</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end mt-4 space-x-3">
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Reset Filters
                    </button>
                    <button
                      type="submit"
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

      <CandidateList candidates={candidates} loading={loading} error={error} />
    </div>
  );
};

export default CandidateSearch;
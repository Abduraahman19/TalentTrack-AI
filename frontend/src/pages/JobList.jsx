// src/pages/JobList.jsx
import { useState, useEffect, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiX, FiFilter, FiEye, FiMapPin, FiClock, FiDollarSign, FiUsers, FiBriefcase } from 'react-icons/fi';
import { useSnackbar } from '../context/SnackbarContext';
import { getJobDescriptions, deleteJobDescription } from '../services/api';
import JobDescriptionForm from '../components/JobDescriptionForm';
import Layout from '../components/Layout/Layout';
import MobileHeader from '../components/Layout/MobileHeader';
import { AuthContext } from '../context/AuthContext';

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState({
    employmentType: '',
    minExperience: '',
    isActive: ''
  });
  const { showSnackbar } = useSnackbar();
  const { user } = useContext(AuthContext);

  // Check if user is viewer (only read access)
  const isViewer = user?.role === 'viewer';
  // Check if user can edit (admin or recruiter)
  const canEdit = user?.role === 'admin' || user?.role === 'recruiter';

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { search: searchTerm, ...filters };
      const response = await getJobDescriptions(params);
      setJobs(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch jobs. Please try again later.');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchJobs]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await deleteJobDescription(id);
        setJobs(jobs.filter(job => job._id !== id));
        showSnackbar('Job deleted successfully', 'success');
      } catch (error) {
        showSnackbar(error.message || 'Failed to delete job', 'error');
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedJob(null);
    fetchJobs();
  };

  const clearFilters = () => {
    setFilters({
      employmentType: '',
      minExperience: '',
      isActive: ''
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (error && jobs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 mx-4 text-red-700 border border-red-200 shadow-sm bg-red-50 rounded-xl"
      >
        <div className="flex items-center">
          <div className="w-5 h-5 mr-3 text-red-500">⚠️</div>
          <p className="font-medium">{error}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <Layout>
      <MobileHeader />
      <div className='h-screen overflow-auto bg-gradient-to-br from-slate-50 via-white to-slate-100'>
        {/* Header Section */}
        <div className="px-6 pt-8 pb-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text">
                  Job Positions
                </h1>
                <p className="mt-2 text-slate-600">
                  Manage and discover career opportunities
                </p>
              </div>
              <div className="items-center hidden space-x-3 text-sm md:flex text-slate-500">
                <span className="px-3 py-1 bg-white border rounded-full shadow-sm border-slate-200">
                  {jobs.length} Total Jobs
                </span>
                <span className="px-3 py-1 border rounded-full bg-emerald-50 text-emerald-700 border-emerald-200">
                  {jobs.filter(job => job.isActive).length} Active
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="px-6 pb-12 lg:px-10">
          <div className="mx-auto space-y-8 max-w-7xl">
            {/* Search and Filter Controls */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4 space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0"
            >
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <FiSearch className="text-lg text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full py-3.5 pl-12 pr-12 text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-xl shadow-sm transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:shadow-md"
                  placeholder="Search by job title, location, or skills..."
                />
                {searchTerm && (
                  <motion.button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 transition-colors text-slate-400 hover:text-slate-600"
                    whileHover={{ scale: 1.1 }}
                  >
                    <FiX className="text-lg" />
                  </motion.button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <motion.button
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className={`flex items-center px-5 py-3 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md ${filtersExpanded ? 'bg-slate-100 border-slate-300' : ''}`}
                  whileHover={{ y: -1 }}
                >
                  <FiFilter className="mr-2 text-lg" />
                  <span className="font-medium">Filters</span>
                  {Object.values(filters).some(Boolean) && (
                    <span className="w-2 h-2 ml-2 bg-indigo-500 rounded-full"></span>
                  )}
                </motion.button>

                {canEdit && (
                  <motion.button
                    onClick={() => {
                      setSelectedJob(null);
                      setShowForm(true);
                    }}
                    className="flex items-center px-6 py-3 font-medium text-white transition-all duration-200 shadow-sm bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl hover:from-indigo-700 hover:to-indigo-800 hover:shadow-lg"
                    whileHover={{ y: -1, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiPlus className="mr-2 text-lg" />
                    New Position
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Expanded Filters */}
            <AnimatePresence>
              {filtersExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="p-6 bg-white border shadow-sm border-slate-200 rounded-xl"
                >
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div>
                      <label className="block mb-3 text-sm font-semibold text-slate-700">
                        Employment Type
                      </label>
                      <select
                        name="employmentType"
                        value={filters.employmentType}
                        onChange={handleFilterChange}
                        className="w-full px-4 py-3 transition-all duration-200 bg-white border rounded-lg border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">All Types</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Temporary">Temporary</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-3 text-sm font-semibold text-slate-700">
                        Minimum Experience
                      </label>
                      <select
                        name="minExperience"
                        value={filters.minExperience}
                        onChange={handleFilterChange}
                        className="w-full px-4 py-3 transition-all duration-200 bg-white border rounded-lg border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Any Experience</option>
                        <option value="1">1+ years</option>
                        <option value="3">3+ years</option>
                        <option value="5">5+ years</option>
                        <option value="10">10+ years</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-3 text-sm font-semibold text-slate-700">
                        Status
                      </label>
                      <select
                        name="isActive"
                        value={filters.isActive}
                        onChange={handleFilterChange}
                        className="w-full px-4 py-3 transition-all duration-200 bg-white border rounded-lg border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">All Statuses</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end mt-6">
                    <motion.button
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm font-medium transition-colors text-slate-600 hover:text-slate-800"
                      whileHover={{ scale: 1.05 }}
                    >
                      Clear All Filters
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content Area */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="relative">
                  <div className="w-12 h-12 border-4 rounded-full border-slate-200 animate-spin"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
              </div>
            ) : !loading && jobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="p-12 text-center bg-white border shadow-sm rounded-xl border-slate-200"
              >
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-slate-100">
                  <FiBriefcase className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-800">No positions found</h3>
                <p className="max-w-md mx-auto mb-6 text-slate-600">
                  {searchTerm || Object.values(filters).some(Boolean)
                    ? 'Try adjusting your search criteria or filters to find more results'
                    : 'Get started by creating your first job position'}
                </p>
                {!searchTerm && !Object.values(filters).some(Boolean) && canEdit && (
                  <motion.button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-3 font-medium text-white transition-all duration-200 shadow-sm bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl hover:from-indigo-700 hover:to-indigo-800 hover:shadow-lg"
                    whileHover={{ y: -1, scale: 1.02 }}
                  >
                    Create First Position
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="grid gap-6"
              >
                <AnimatePresence>
                  {jobs.map((job, index) => (
                    <motion.div
                      key={job._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, scale: 0.95 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: index * 0.05,
                        layout: { duration: 0.3 }
                      }}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      className="relative p-6 overflow-hidden transition-all duration-300 bg-white border shadow-sm group border-slate-200 rounded-xl hover:shadow-xl"
                    >
                      
                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="mb-2 text-xl font-bold transition-colors text-slate-800 group-hover:text-indigo-700">
                                  {job.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-4 mb-3 text-slate-600">
                                  <div className="flex items-center">
                                    <FiMapPin className="w-4 h-4 mr-1.5" />
                                    <span className="text-sm">{job.location}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <FiClock className="w-4 h-4 mr-1.5" />
                                    <span className="text-sm">{job.employmentType}</span>
                                  </div>
                                  <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    job.isActive 
                                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${job.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                    {job.isActive ? 'Active' : 'Inactive'}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center ml-4 space-x-2">
                                {isViewer ? (
                                  <motion.button
                                    className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="View Job (Read-only)"
                                  >
                                    <FiEye className="w-4 h-4" />
                                  </motion.button>
                                ) : canEdit ? (
                                  <>
                                    <motion.button
                                      onClick={() => {
                                        setSelectedJob(job);
                                        setShowForm(true);
                                      }}
                                      className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      title="Edit Position"
                                    >
                                      <FiEdit2 className="w-5 h-5" />
                                    </motion.button>
                                    <motion.button
                                      onClick={() => handleDelete(job._id)}
                                      className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      title="Delete Position"
                                    >
                                      <FiTrash2 className="w-5 h-5" />
                                    </motion.button>
                                  </>
                                ) : null}
                              </div>
                            </div>

                            {job.description && (
                              <p className="mb-4 text-sm leading-relaxed text-slate-700 line-clamp-2">
                                {job.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Skills Section */}
                        {job.requiredSkills?.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2.5">Required Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {job.requiredSkills.slice(0, 8).map((skill, skillIndex) => (
                                <motion.span
                                  key={skillIndex}
                                  className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: skillIndex * 0.03 }}
                                >
                                  {skill}
                                </motion.span>
                              ))}
                              {job.requiredSkills.length > 8 && (
                                <span className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg">
                                  +{job.requiredSkills.length - 8} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {job.preferredSkills?.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2.5">Preferred Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {job.preferredSkills.slice(0, 6).map((skill, skillIndex) => (
                                <motion.span
                                  key={skillIndex}
                                  className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: skillIndex * 0.03 }}
                                >
                                  {skill}
                                </motion.span>
                              ))}
                              {job.preferredSkills.length > 6 && (
                                <span className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg">
                                  +{job.preferredSkills.length - 6} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Job Details Grid */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t md:grid-cols-4 border-slate-100">
                          <motion.div 
                            className="p-3 text-center transition-colors rounded-lg bg-slate-50 hover:bg-slate-100"
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-center justify-center mb-1">
                              <FiBriefcase className="w-4 h-4 mr-1 text-slate-500" />
                              <p className="text-xs font-medium text-slate-500">Experience</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-800">
                              {job.minExperience || '0'}+ years
                            </p>
                          </motion.div>

                          <motion.div 
                            className="p-3 text-center transition-colors rounded-lg bg-slate-50 hover:bg-slate-100"
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-center justify-center mb-1">
                              <FiDollarSign className="w-4 h-4 mr-1 text-slate-500" />
                              <p className="text-xs font-medium text-slate-500">Salary Range</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-800">
                              {job.salaryRange?.min && job.salaryRange?.max
                                ? `$${(job.salaryRange.min / 1000).toFixed(0)}K - $${(job.salaryRange.max / 1000).toFixed(0)}K`
                                : 'Negotiable'
                              }
                            </p>
                          </motion.div>

                          <motion.div 
                            className="p-3 text-center transition-colors rounded-lg bg-slate-50 hover:bg-slate-100"
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-center justify-center mb-1">
                              <FiUsers className="w-4 h-4 mr-1 text-slate-500" />
                              <p className="text-xs font-medium text-slate-500">Candidates</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-800">
                              {job.candidatesCount || 0}
                            </p>
                          </motion.div>

                          <motion.div 
                            className="p-3 text-center transition-colors rounded-lg bg-slate-50 hover:bg-slate-100"
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-center justify-center mb-1">
                              <FiClock className="w-4 h-4 mr-1 text-slate-500" />
                              <p className="text-xs font-medium text-slate-500">Posted</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-800">
                              {job.createdAt 
                                ? new Date(job.createdAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })
                                : 'Recently'
                              }
                            </p>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>

        {/* Form Modal */}
        {canEdit && (
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200"
                >
                  <JobDescriptionForm
                    job={selectedJob}
                    onSuccess={handleFormSuccess}
                    onCancel={() => {
                      setShowForm(false);
                      setSelectedJob(null);
                    }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </Layout>
  );
};

export default JobList;
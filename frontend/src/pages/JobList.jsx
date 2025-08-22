// src/pages/JobList.jsx
import { useState, useEffect, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiX, FiFilter, FiEye } from 'react-icons/fi';
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
        className="p-4 text-red-600 bg-red-100 rounded-lg shadow"
      >
        {error}
      </motion.div>
    );
  }

  return (
    <Layout>
      <MobileHeader />
      <div className="min-h-screen overflow-auto pb-14 bg-gray-50">
        <div className='pt-8 pl-10'>
          <h1 className='text-3xl font-bold'>Jobs</h1>
        </div>
        <div className="px-16 pt-5 pb-10 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col justify-between space-y-4 md:space-y-0 md:flex-row md:items-center"
          >
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full py-2 pl-10 pr-4 transition-all duration-200 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search jobs..."
              />
              {searchTerm && (
                <motion.button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  whileHover={{ scale: 1.1 }}
                >
                  <FiX />
                </motion.button>
              )}
            </div>
            <div className="flex space-x-3">
              <motion.button
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                whileHover={{ y: -1 }}
              >
                <FiFilter className="mr-2" />
                Filters
              </motion.button>

              {/* Show Add New Job button for admins and recruiters */}
              {canEdit && (
                <motion.button
                  onClick={() => {
                    setSelectedJob(null);
                    setShowForm(true);
                  }}
                  className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                >
                  <FiPlus className="mr-2" />
                  Add New Job
                </motion.button>
              )}
            </div>
          </motion.div>

          <AnimatePresence>
            {filtersExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Employment Type
                    </label>
                    <select
                      name="employmentType"
                      value={filters.employmentType}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Types</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Temporary">Temporary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Minimum Experience
                    </label>
                    <select
                      name="minExperience"
                      value={filters.minExperience}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Any</option>
                      <option value="1">1+ years</option>
                      <option value="3">3+ years</option>
                      <option value="5">5+ years</option>
                      <option value="10">10+ years</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      name="isActive"
                      value={filters.isActive}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <motion.button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    whileHover={{ scale: 1.05 }}
                  >
                    Clear Filters
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
          ) : !loading && jobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-8 text-center bg-white rounded-lg shadow"
            >
              <h3 className="text-lg font-medium text-gray-700">No jobs found</h3>
              <p className="mt-1 text-gray-500">
                {searchTerm || Object.values(filters).some(Boolean)
                  ? 'Try adjusting your search or filters'
                  : 'Create your first job description'}
              </p>
              {!searchTerm && !Object.values(filters).some(Boolean) && canEdit && (
                <motion.button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  whileHover={{ y: -1 }}
                >
                  Create Job
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <AnimatePresence>
                {jobs.map((job) => (
                  <motion.div
                    key={job._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -2 }}
                    className="p-6 transition-all bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md"
                  >
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{job.title}</h3>
                        <p className="text-gray-600">{job.location} • {job.employmentType}</p>
                      </div>

                      {/* Show different buttons based on user role */}
                      {isViewer ? (
                        <motion.button
                          className="p-2 text-gray-600 hover:text-blue-600"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          title="View Job (Read-only)"
                        >
                          <FiEye />
                        </motion.button>
                      ) : canEdit ? (
                        <div className="flex space-x-2">
                          <motion.button
                            onClick={() => {
                              setSelectedJob(job);
                              setShowForm(true);
                            }}
                            className="p-2 text-gray-600 hover:text-blue-600"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FiEdit2 />
                          </motion.button>
                          <motion.button
                            onClick={() => handleDelete(job._id)}
                            className="p-2 text-gray-600 hover:text-red-600"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FiTrash2 />
                          </motion.button>
                        </div>
                      ) : null}
                    </div>

                    {job.description && (
                      <p className="mt-2 text-gray-700 line-clamp-2">{job.description}</p>
                    )}

                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700">Required Skills</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {job.requiredSkills.map((skill, index) => (
                          <motion.span
                            key={index}
                            className="px-3 py-1 text-sm text-blue-800 bg-blue-100 rounded-full"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            {skill}
                          </motion.span>
                        ))}
                      </div>
                    </div>

                    {job.preferredSkills?.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700">Preferred Skills</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {job.preferredSkills.map((skill, index) => (
                            <motion.span
                              key={index}
                              className="px-3 py-1 text-sm text-green-800 bg-green-100 rounded-full"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              {skill}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4">
                      <motion.div whileHover={{ scale: 1.02 }}>
                        <p className="text-sm text-gray-500">Experience</p>
                        <p className="font-medium">{job.minExperience || '0'}+ years</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }}>
                        <p className="text-sm text-gray-500">Salary Range</p>
                        <p className="font-medium">
                          {job.salaryRange?.min ? `$${job.salaryRange.min.toLocaleString()}` : 'N/A'} -
                          {job.salaryRange?.max ? ` $${job.salaryRange.max.toLocaleString()}` : 'N/A'}
                        </p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }}>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className={`font-medium ${job.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                          {job.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }}>
                        <p className="text-sm text-gray-500">Candidates</p>
                        <p className="font-medium">{job.candidatesCount || 0}</p>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Show form modal only for admins and recruiters */}
        {canEdit && (
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl"
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
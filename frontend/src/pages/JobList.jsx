import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiX } from 'react-icons/fi';
import { useSnackbar } from '../context/SnackbarContext';
import { getJobDescriptions, deleteJobDescription } from '../services/api';
import JobDescriptionForm from '../components/JobDescriptionForm';

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await getJobDescriptions({ search: searchTerm });
        setJobs(response.data);
      } catch (err) {
        setError('Failed to fetch jobs. Please try again later.');
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [searchTerm]);

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
    // Refresh the list
    setSearchTerm(prev => prev + ' '); // Force re-fetch
    setTimeout(() => setSearchTerm(prev => prev.trim()), 100);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 md:space-y-0 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search jobs..."
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              <FiX />
            </button>
          )}
        </div>
        <button
          onClick={() => {
            setSelectedJob(null);
            setShowForm(true);
          }}
          className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <FiPlus className="mr-2" />
          Add New Job
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
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
        )}
      </AnimatePresence>

      {jobs.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">No jobs found</h3>
          <p className="mt-1 text-gray-500">
            {searchTerm ? 'Try a different search term' : 'Create your first job description'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Create Job
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md"
            >
              <div className="flex justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{job.title}</h3>
                  <p className="text-gray-600">{job.location} • {job.employmentType}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      setShowForm(true);
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => handleDelete(job._id)}
                    className="p-2 text-gray-600 hover:text-red-600"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              {job.description && (
                <p className="mt-2 text-gray-700 line-clamp-2">{job.description}</p>
              )}

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700">Required Skills</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {job.requiredSkills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 text-sm text-blue-800 bg-blue-100 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {job.preferredSkills?.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700">Preferred Skills</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {job.preferredSkills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 text-sm text-green-800 bg-green-100 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-gray-500">Experience</p>
                  <p className="font-medium">{job.minExperience || '0'}+ years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Salary Range</p>
                  <p className="font-medium">
                    {job.salaryRange?.min ? `$${job.salaryRange.min}` : 'N/A'} - 
                    {job.salaryRange?.max ? ` $${job.salaryRange.max}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-medium ${job.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                    {job.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Candidates</p>
                  <p className="font-medium">{job.candidatesCount || 0}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobList;
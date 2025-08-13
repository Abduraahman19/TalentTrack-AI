import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCandidates, updateCandidateStatus, deleteCandidate } from '../services/api';
import { FiDownload, FiEye, FiThumbsUp, FiThumbsDown, FiMail, FiPhone, FiEdit, FiTrash2 } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useSnackbar } from '../context/SnackbarContext';

const CandidateList = ({ token, reloadKey, limit }) => {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [minScore, setMinScore] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const params = {
          search: searchTerm,
          minScore: minScore,
          status: statusFilter,
          skill: skillFilter,
          limit: limit
        };

        // Remove empty parameters
        Object.keys(params).forEach(key => {
          if (!params[key]) delete params[key];
        });

        const response = await getCandidates(params, token);

        if (response.data) {
          setCandidates(response.data);
        } else {
          setCandidates([]);
        }
      } catch (err) {
        setError('Failed to fetch candidates');
        console.error('Fetch candidates error:', err);
        showSnackbar('Failed to load candidates', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [token, reloadKey, searchTerm, minScore, statusFilter, skillFilter, limit]);

  const handleStatusChange = async (candidateId, status) => {
    try {
      const updatedCandidate = await updateCandidateStatus(candidateId, status, token);

      setCandidates(prev => prev.map(c =>
        c._id === candidateId ? { ...c, status: updatedCandidate.status } : c
      ));

      showSnackbar(`Candidate status updated to ${status}`, 'success');
    } catch (error) {
      showSnackbar('Failed to update status', 'error');
      console.error('Status update error:', error);
    }
  };

  const handleDelete = async (candidateId) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;

    try {
      await deleteCandidate(candidateId, token);
      setCandidates(prev => prev.filter(c => c._id !== candidateId));
      showSnackbar('Candidate deleted successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to delete candidate', 'error');
      console.error('Delete error:', error);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  if (error) return <div className="py-8 text-center text-red-500">{error}</div>;

  if (candidates.length === 0) return (
    <div className="py-8 text-center text-gray-500">
      No candidates found. {user.role === 'recruiter' && 'Try uploading some resumes!'}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Search</label>
          <input
            type="text"
            placeholder="Name, email or skill"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Min Match Score</label>
          <select
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Scores</option>
            <option value="70">70%+</option>
            <option value="80">80%+</option>
            <option value="90">90%+</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interviewed">Interviewed</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Skill</label>
          <input
            type="text"
            placeholder="Filter by skill"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Candidate Cards */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
        {candidates.map(candidate => (
          <motion.div
            key={candidate._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden transition-shadow border rounded-lg shadow-sm hover:shadow-md"
          >
            <div className="p-5 bg-white">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                {/* Candidate Info */}
                <div className="flex-1">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                        <span className="font-medium text-blue-600">
                          {candidate.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800 truncate">
                          {candidate.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${candidate.status === 'new' ? 'bg-gray-100 text-gray-800' :
                          candidate.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                            candidate.status === 'interviewed' ? 'bg-yellow-100 text-yellow-800' :
                              candidate.status === 'hired' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                          }`}>
                          {candidate.status}
                        </span>
                      </div>
                      <div className="flex flex-col mt-1 text-sm text-gray-500 sm:flex-row sm:flex-wrap sm:space-x-4">
                        <div className="flex items-center">
                          <FiMail className="mr-1" />
                          <span>{candidate.email}</span>
                        </div>
                        {candidate.phone && (
                          <div className="flex items-center">
                            <FiPhone className="mr-1" />
                            <span>{candidate.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Skills */}
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700">Skills:</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {candidate.skills.slice(0, 8).map(skill => (
                            <span
                              key={skill}
                              className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                          {candidate.skills.length > 8 && (
                            <span className="px-2 py-1 text-xs text-gray-800 bg-gray-100 rounded">
                              +{candidate.skills.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Experience */}
                  {candidate.experience?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700">Experience:</h4>
                      <div className="mt-1 space-y-2">
                        {candidate.experience.slice(0, 2).map((exp, i) => (
                          <div key={i} className="text-sm">
                            <p className="font-medium">
                              {exp.jobTitle} at {exp.company}
                            </p>
                            <p className="text-gray-600">{exp.duration}</p>
                          </div>
                        ))}
                        {candidate.experience.length > 2 && (
                          <p className="text-xs text-gray-500">
                            +{candidate.experience.length - 2} more positions
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Match Scores */}
                <div className="mt-4 md:mt-0 md:ml-4 md:w-64">
                  <h4 className="mb-2 text-sm font-medium text-gray-700">Role Matches:</h4>
                  <div className="space-y-3">
                    {candidate.roleMatchScores?.slice(0, 3).map((match, i) => (
                      <div key={i} className="p-2 rounded bg-gray-50">
                        <p className="text-sm font-medium text-gray-800">
                          {match.roleId?.title || 'Unknown Role'}
                        </p>
                        <div className="flex items-center mt-1">
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div
                              className={`h-2 rounded-full ${match.score > 80 ? 'bg-green-500' :
                                match.score > 60 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                              style={{ width: `${match.score}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-xs font-medium text-gray-700">
                            {match.score}%
                          </span>
                        </div>
                        {match.explanation && (
                          <p className="mt-1 text-xs text-gray-600 truncate">
                            {match.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                    {candidate.roleMatchScores?.length > 3 && (
                      <p className="text-xs text-center text-gray-500">
                        +{candidate.roleMatchScores.length - 3} more matches
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-4 border-t border-gray-100">
                <div className="flex space-x-2">
                  {candidate.resumePath && (
                    <a
                      href={`http://localhost:5000${candidate.resumePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <FiDownload className="mr-1" />
                      Resume
                    </a>
                  )}
                </div>

                <div className="flex space-x-2">
                  {(user.role === 'admin' || (user.role === 'recruiter' && candidate.uploadedBy._id === user.id)) && (
                    <>
                      <button
                        onClick={() => handleStatusChange(candidate._id, 'shortlisted')}
                        className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${candidate.status === 'shortlisted'
                          ? 'bg-blue-100 text-blue-800'
                          : 'text-blue-700 hover:bg-blue-50'
                          }`}
                      >
                        <FiThumbsUp className="mr-1" />
                        Shortlist
                      </button>
                      <button
                        onClick={() => handleStatusChange(candidate._id, 'rejected')}
                        className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${candidate.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'text-red-700 hover:bg-red-50'
                          }`}
                      >
                        <FiThumbsDown className="mr-1" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleDelete(candidate._id)}
                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 rounded-md hover:text-red-700 hover:bg-red-50"
                      >
                        <FiTrash2 className="mr-1" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CandidateList;
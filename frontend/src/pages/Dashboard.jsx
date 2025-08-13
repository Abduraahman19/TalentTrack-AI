import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import CandidateList from "../components/CandidateList";
import ResumeUpload from "../components/ResumeUpload";
import StatsCard from "../components/StatsCard";
import { motion } from "framer-motion";
import { FiUpload, FiUsers, FiEye, FiUserCheck, FiUserX, FiHome, FiFileText, FiSettings } from "react-icons/fi";
import { getCandidates } from "../services/api";

const Dashboard = () => {
  const { user, loading, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalCandidates: 0,
    shortlisted: 0,
    interviewed: 0,
    hired: 0
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    } else if (user) {
      fetchStats();
    }
  }, [loading, user, navigate, refreshKey]);

  const fetchStats = async () => {
    try {
      const response = await getCandidates();
      const candidates = response.data || [];
      
      setStats({
        totalCandidates: candidates.length,
        shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
        interviewed: candidates.filter(c => c.status === 'interviewed').length,
        hired: candidates.filter(c => c.status === 'hired').length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200">
          <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
            <h1 className="text-xl font-bold text-white">TalentTrack AI</h1>
          </div>
          <div className="flex flex-col flex-grow px-4 py-4 overflow-y-auto">
            <nav className="flex-1 space-y-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg w-full ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <FiHome className="mr-3" />
                Dashboard
              </motion.button>
              
              {(user.role === 'admin' || user.role === 'recruiter') && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('upload')}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg w-full ${activeTab === 'upload' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <FiUpload className="mr-3" />
                  Upload Resume
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('candidates')}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg w-full ${activeTab === 'candidates' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <FiUsers className="mr-3" />
                Candidates
              </motion.button>
              
              {user.role === 'admin' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg w-full ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <FiSettings className="mr-3" />
                  Settings
                </motion.button>
              )}
            </nav>
          </div>
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                  <span className="font-medium text-blue-600">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs font-medium text-gray-500 capitalize">
                  {user.role}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-4 py-2 mt-4 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 md:hidden">
          <h1 className="text-lg font-semibold text-gray-800">TalentTrack AI</h1>
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
              <span className="text-xs font-medium text-blue-600">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex border-b border-gray-200 md:hidden">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            <FiHome className="mx-auto" />
          </button>
          {(user.role === 'admin' || user.role === 'recruiter') && (
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === 'upload' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              <FiUpload className="mx-auto" />
            </button>
          )}
          <button
            onClick={() => setActiveTab('candidates')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'candidates' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            <FiUsers className="mx-auto" />
          </button>
          {user.role === 'admin' && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              <FiSettings className="mx-auto" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto md:p-6">
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Welcome back, {user.firstName}!
                </h2>
                <p className="text-gray-600">
                  {user.role === 'admin' 
                    ? 'You have full administrative access to the system.'
                    : user.role === 'recruiter'
                    ? 'You can upload and manage your candidates.'
                    : 'You can view shortlisted and interviewed candidates.'}
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  icon={<FiUsers className="text-blue-500" size={24} />}
                  title="Total Candidates"
                  value={stats.totalCandidates}
                  change={null}
                />
                <StatsCard
                  icon={<FiUserCheck className="text-green-500" size={24} />}
                  title="Shortlisted"
                  value={stats.shortlisted}
                  change={null}
                />
                <StatsCard
                  icon={<FiEye className="text-yellow-500" size={24} />}
                  title="Interviewed"
                  value={stats.interviewed}
                  change={null}
                />
                <StatsCard
                  icon={<FiFileText className="text-purple-500" size={24} />}
                  title="Hired"
                  value={stats.hired}
                  change={null}
                />
              </div>

              {/* Recent Activity */}
              <div className="p-6 bg-white rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Recent Candidates</h3>
                  <button 
                    onClick={() => setActiveTab('candidates')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  <CandidateList key={refreshKey} limit={3} />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'upload' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Upload Resume</h2>
                <p className="text-gray-600">
                  Upload candidate resumes in PDF or DOCX format. The system will automatically extract and analyze the content.
                </p>
              </div>
              <ResumeUpload onUploadSuccess={handleUploadSuccess} />
            </motion.div>
          )}

          {activeTab === 'candidates' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Candidate Management</h2>
                <p className="text-gray-600">
                  {user.role === 'admin'
                    ? 'View and manage all candidates in the system.'
                    : user.role === 'recruiter'
                    ? 'View and manage the candidates you uploaded.'
                    : 'View shortlisted and interviewed candidates.'}
                </p>
              </div>
              <CandidateList key={refreshKey} />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>
                <p className="text-gray-600">
                  Configure system preferences and manage users.
                </p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow">
                <p className="text-gray-600">Settings panel will be implemented here.</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
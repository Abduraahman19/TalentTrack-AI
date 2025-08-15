import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import CandidateList from "../components/CandidateList";
import ResumeUpload from "../components/ResumeUpload";
import StatsCard from "../components/StatsCard";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiUpload, 
  FiUsers, 
  FiEye, 
  FiUserCheck, 
  FiUserX, 
  FiHome, 
  FiFileText, 
  FiSettings,
  FiChevronRight,
  FiLogOut
} from "react-icons/fi";
import { getCandidates } from "../services/api";
import { Tooltip } from "react-tooltip";

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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      const candidates = Array.isArray(response?.data) ? response.data : [];

      setStats({
        totalCandidates: candidates.length,
        shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
        interviewed: candidates.filter(c => c.status === 'interviewed').length,
        hired: candidates.filter(c => c.status === 'hired').length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        totalCandidates: 0,
        shortlisted: 0,
        interviewed: 0,
        hired: 0
      });
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
      <div className="flex items-center justify-center h-screen bg-gradient-to-r from-blue-50 to-indigo-50">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent"
        ></motion.div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const tabContentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { 
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

  const sidebarVariants = {
    open: { width: "16rem" },
    closed: { width: "5rem" }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Sidebar */}
      <motion.div 
        className="flex-col hidden bg-white border-r border-gray-200 shadow-sm md:flex"
        animate={sidebarOpen ? "open" : "closed"}
        variants={sidebarVariants}
        initial="open"
      >
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
          {sidebarOpen ? (
            <h1 className="text-xl font-bold text-white">TalentTrack AI</h1>
          ) : (
            <h1 className="text-xl font-bold text-white">TT</h1>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 text-white rounded-full hover:bg-white/20"
          >
            <FiChevronRight className={`transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        <div className="flex flex-col flex-grow px-2 py-4 overflow-y-auto">
          <nav className="flex-1 space-y-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg w-full ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-100 text-blue-600 shadow-inner' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiHome className="flex-shrink-0" />
              {sidebarOpen && <span className="ml-3">Dashboard</span>}
            </motion.button>

            {(user.role === 'admin' || user.role === 'recruiter') && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('upload')}
                className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg w-full ${
                  activeTab === 'upload' 
                    ? 'bg-blue-100 text-blue-600 shadow-inner' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FiUpload className="flex-shrink-0" />
                {sidebarOpen && <span className="ml-3">Upload Resume</span>}
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('candidates')}
              className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg w-full ${
                activeTab === 'candidates' 
                  ? 'bg-blue-100 text-blue-600 shadow-inner' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiUsers className="flex-shrink-0" />
              {sidebarOpen && <span className="ml-3">Candidates</span>}
            </motion.button>

            {user.role === 'admin' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('settings')}
                className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg w-full ${
                  activeTab === 'settings' 
                    ? 'bg-blue-100 text-blue-600 shadow-inner' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FiSettings className="flex-shrink-0" />
                {sidebarOpen && <span className="ml-3">Settings</span>}
              </motion.button>
            )}
          </nav>
        </div>
        
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center p-2 rounded-lg hover:bg-gray-100">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500">
                <span className="font-medium text-white">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </span>
              </div>
            </div>
            {sidebarOpen && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs font-medium text-gray-500 capitalize truncate">
                  {user.role}
                </p>
              </div>
            )}
          </div>
          <motion.button
            whileHover={{ x: 5 }}
            onClick={handleLogout}
            className={`flex items-center w-full px-3 py-2 mt-2 text-sm text-red-600 rounded-lg ${
              sidebarOpen ? 'justify-start' : 'justify-center'
            }`}
          >
            <FiLogOut />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm md:hidden">
          <h1 className="text-lg font-semibold text-gray-800">TalentTrack AI</h1>
          <div className="flex items-center space-x-2">
            <div 
              className="flex items-center justify-center w-8 h-8 rounded-full cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-500"
              data-tooltip-id="user-tooltip"
              data-tooltip-content={`${user.firstName} ${user.lastName} (${user.role})`}
            >
              <span className="text-xs font-medium text-white">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </span>
            </div>
            <Tooltip id="user-tooltip" />
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex bg-white border-b border-gray-200 shadow-sm md:hidden">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 text-sm font-medium relative ${
              activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <FiHome className="mx-auto" />
            {activeTab === 'dashboard' && (
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"
                layoutId="mobile-tab-indicator"
              />
            )}
          </button>
          {(user.role === 'admin' || user.role === 'recruiter') && (
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-3 text-sm font-medium relative ${
                activeTab === 'upload' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <FiUpload className="mx-auto" />
              {activeTab === 'upload' && (
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"
                  layoutId="mobile-tab-indicator"
                />
              )}
            </button>
          )}
          <button
            onClick={() => setActiveTab('candidates')}
            className={`flex-1 py-3 text-sm font-medium relative ${
              activeTab === 'candidates' ? 'text-blue-600' : 'text-gray-500'
              }`}
          >
            <FiUsers className="mx-auto" />
            {activeTab === 'candidates' && (
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"
                layoutId="mobile-tab-indicator"
              />
            )}
          </button>
          {user.role === 'admin' && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 text-sm font-medium relative ${
                activeTab === 'settings' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <FiSettings className="mx-auto" />
              {activeTab === 'settings' && (
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"
                  layoutId="mobile-tab-indicator"
                />
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto md:p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="mb-8">
                  <motion.h2 
                    className="text-2xl font-bold text-gray-800"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    Welcome back, <span className="text-blue-600">{user.firstName}</span>!
                  </motion.h2>
                  <motion.p 
                    className="text-gray-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {user.role === 'admin'
                      ? 'You have full administrative access to the system.'
                      : user.role === 'recruiter'
                        ? 'You can upload and manage your candidates.'
                        : 'You can view shortlisted and interviewed candidates.'}
                  </motion.p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-5 mb-8 md:grid-cols-2 lg:grid-cols-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <StatsCard
                      icon={<FiUsers className="text-blue-500" size={24} />}
                      title="Total Candidates"
                      value={stats.totalCandidates}
                      trend="up"
                      trendValue="12%"
                      color="blue"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <StatsCard
                      icon={<FiUserCheck className="text-green-500" size={24} />}
                      title="Shortlisted"
                      value={stats.shortlisted}
                      trend="up"
                      trendValue="8%"
                      color="green"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <StatsCard
                      icon={<FiEye className="text-amber-500" size={24} />}
                      title="Interviewed"
                      value={stats.interviewed}
                      trend="down"
                      trendValue="3%"
                      color="amber"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <StatsCard
                      icon={<FiFileText className="text-purple-500" size={24} />}
                      title="Hired"
                      value={stats.hired}
                      trend="up"
                      trendValue="5%"
                      color="purple"
                    />
                  </motion.div>
                </div>

                {/* Recent Activity */}
                <motion.div 
                  className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Recent Candidates</h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab('candidates')}
                      className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      View All
                      <FiChevronRight className="ml-1" />
                    </motion.button>
                  </div>
                  <div className="space-y-4">
                    <CandidateList key={refreshKey} limit={3} />
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'upload' && (
              <motion.div
                key="upload"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="mb-8">
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
                key="candidates"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="mb-8">
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
                key="settings"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>
                  <p className="text-gray-600">
                    Configure system preferences and manage users.
                  </p>
                </div>
                <motion.div 
                  className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-gray-600">Settings panel will be implemented here.</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
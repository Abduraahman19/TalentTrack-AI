
// src/pages/Dashboard.jsx (updated)
import { useContext, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../components/Layout/Layout";
import MobileHeader from "../components/Layout/MobileHeader";
import StatsCard from "../components/StatsCard";
import CandidateList from "../components/CandidateList";
import { AuthContext } from "../context/AuthContext";
import { getCandidates, getJobDescriptions } from "../services/api";
import {
  FiUsers,
  FiUserCheck,
  FiEye,
  FiFileText,
  FiBriefcase,
  FiXCircle,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    shortlisted: 0,
    interviewed: 0,
    hired: 0,
    rejected: 0,
    totalJobs: 0
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, refreshKey]);

  // src/pages/Dashboard.jsx - Update fetchStats function
  const fetchStats = async () => {
    try {
      const params = {};

      // Add company filter for recruiters
      if (user?.role === 'recruiter' && user?.companyId) {
        params.companyId = user.companyId;
      }

      const [candidatesResponse, jobsResponse] = await Promise.all([
        getCandidates(params),
        getJobDescriptions(params) // Make sure this also accepts companyId
      ]);

      const candidates = Array.isArray(candidatesResponse?.data) ? candidatesResponse.data : [];
      const jobs = Array.isArray(jobsResponse?.data) ? jobsResponse.data : [];

      setStats({
        totalCandidates: candidates.length,
        shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
        interviewed: candidates.filter(c => c.status === 'interviewed').length,
        hired: candidates.filter(c => c.status === 'hired').length,
        rejected: candidates.filter(c => c.status === 'rejected').length,
        totalJobs: jobs.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        totalCandidates: 0,
        shortlisted: 0,
        interviewed: 0,
        hired: 0,
        rejected: 0,
        totalJobs: 0
      });
    }
  };

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Layout>
      <MobileHeader />

      <div className="flex-1 p-4 overflow-y-auto md:p-6">
        <div className="mb-8">
          <motion.h2
            className="text-2xl font-bold text-gray-800"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Welcome back, <span className="text-blue-600">{user.firstName} {user.lastName}</span>!
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
          >
            <StatsCard
              icon={<FiXCircle className="text-red-500" size={24} />}
              title="Rejected"
              value={stats.rejected}
              change={-2}
              color="red"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <StatsCard
              icon={<FiBriefcase className="text-indigo-500" size={24} />}
              title="Active Jobs"
              value={stats.totalJobs}
              trend="up"
              trendValue="10%"
              color="indigo"
            />
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Candidates</h3>
            <Link to="/candidates">
            <button className="font-bold text-sky-600 hover:text-sky-700 hover:underline">View All Candidates</button>
          </Link>
          </div>
          <div className="space-y-4">
            <CandidateList key={refreshKey} limit={3} />
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Dashboard;
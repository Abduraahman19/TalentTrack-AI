// src/components/Layout/Layout.jsx
import { useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { motion } from "framer-motion";
import {
  FiHome,
  FiUpload,
  FiUsers,
  FiBriefcase,
  FiSettings,
  FiChevronRight,
  FiLogOut
} from "react-icons/fi";
import { FaBuilding } from "react-icons/fa"; // Font Awesome set

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigationItems = [
    { id: 'dashboard', path: '/home', label: 'Dashboard', icon: FiHome, roles: ['admin', 'recruiter'] },
    { id: 'upload', path: '/upload', label: 'Upload Resume', icon: FiUpload, roles: ['admin'] },
    { id: 'candidates', path: '/candidates', label: 'Candidates', icon: FiUsers, roles: ['admin', 'recruiter'] },
    { id: 'jobs', path: '/jobs', label: 'Jobs', icon: FiBriefcase, roles: ['admin', 'recruiter', 'viewer'] },
    // { id: 'settings', path: '/settings', label: 'Settings', icon: FiSettings, roles: ['admin'] },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path ||
      (path !== '/home' && location.pathname.startsWith(path));
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
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">TalentTrack AI</h1>
            </div>
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
          {/* Company Name Banner - Always visible */}
          {user.company && (
            <div className="px-3 py-2 mb-4 rounded-lg bg-blue-50">
              <div className="flex items-center">
                <FaBuilding className="flex-shrink-0 w-4 h-4 text-blue-600" />
                {sidebarOpen && (
                  <span className="ml-2 text-sm font-medium text-blue-800 truncate">
                    {user.company.name}
                  </span>
                )}
              </div>
            </div>
          )}

          <nav className="flex-1 space-y-1">
            {navigationItems.map((item) => {
              if (!item.roles.includes(user.role)) return null;

              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigateTo(item.path)}
                  className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg w-full ${isActive(item.path)
                      ? 'bg-blue-100 text-blue-600 shadow-inner'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <item.icon className="flex-shrink-0" />
                  {sidebarOpen && <span className="ml-3">{item.label}</span>}
                </motion.button>
              );
            })}
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
                {user.company && (
                  <p className="text-xs text-gray-400 truncate">
                    {user.company.name}
                  </p>
                )}
              </div>
            )}
          </div>
          <motion.button
            whileHover={{ x: 5 }}
            onClick={handleLogout}
            className={`flex items-center w-full px-3 py-2 mt-2 text-sm text-red-600 rounded-lg ${sidebarOpen ? 'justify-start' : 'justify-center'
              }`}
          >
            <FiLogOut />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Desktop Header with Company Name */}
        <div className="items-center justify-between hidden px-6 py-3 bg-white border-b border-gray-200 shadow-sm md:flex">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-800 capitalize">
              {location.pathname === '/home' && 'Dashboard'}
              {location.pathname === '/upload' && 'Upload Resume'}
              {location.pathname === '/candidates' && 'Candidates'}
              {location.pathname.startsWith('/candidates/') && 'Candidate Profile'}
              {location.pathname === '/jobs' && 'Jobs'}
              {location.pathname === '/settings' && 'Settings'}
            </h2>
          </div>
          
          {user.company && (
            <div className="flex items-center px-4 py-2 rounded-full bg-blue-50">
              <FaBuilding className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {user.company.name}
              </span>
            </div>
          )}
        </div>

        {children}
      </div>
    </div>
  );
};

export default Layout;
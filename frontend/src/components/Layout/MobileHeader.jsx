// src/components/Layout/MobileHeader.jsx
import { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { Tooltip } from "react-tooltip";
import {
  FiHome,
  FiUpload,
  FiUsers,
  FiBriefcase,
  FiSettings,
} from "react-icons/fi";

const MobileHeader = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { id: 'dashboard', path: '/home', label: 'Dashboard', icon: FiHome, roles: ['admin', 'recruiter', 'viewer'] },
    { id: 'upload', path: '/upload', label: 'Upload', icon: FiUpload, roles: ['admin', 'recruiter'] },
    { id: 'candidates', path: '/candidates', label: 'Candidates', icon: FiUsers, roles: ['admin', 'recruiter', 'viewer'] },
    { id: 'jobs', path: '/jobs', label: 'Jobs', icon: FiBriefcase, roles: ['admin', 'recruiter', 'viewer'] },
    { id: 'settings', path: '/settings', label: 'Settings', icon: FiSettings, roles: ['admin'] },
  ];

  const navigateTo = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path || 
           (path !== '/home' && location.pathname.startsWith(path));
  };

  return (
    <>
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

      <div className="flex bg-white border-b border-gray-200 shadow-sm md:hidden">
        {navigationItems.map((item) => {
          if (!item.roles.includes(user.role)) return null;
          
          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.path)}
              className={`flex-1 py-3 text-sm font-medium relative ${
                isActive(item.path) ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <item.icon className="mx-auto" />
              {isActive(item.path) && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"
                  layoutId="mobile-tab-indicator"
                />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default MobileHeader;
import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          initial={{ opacity: 0.5, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: 360,
            transition: {
              rotate: {
                repeat: Infinity,
                duration: 1.5,
                ease: "linear"
              },
              scale: {
                type: "spring",
                damping: 10,
                stiffness: 100
              }
            }
          }}
          className="flex flex-col items-center"
        >
        </motion.div>
      </div>
    );
  }

  if (!user) {
    // Store the attempted URL for redirect after login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/home" state={{ unauthorized: true }} replace />;
  }

  return children;
};

export default ProtectedRoute;
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const StatsCard = ({ icon, title, value, change, color = 'blue'}) => {
  // Color configurations
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-100',
    },
    green: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      text: 'text-green-600',
      border: 'border-green-100',
    },
    amber: {
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      text: 'text-purple-600',
      border: 'border-purple-100',
    },
    red: {
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      text: 'text-red-600',
      border: 'border-red-100',
    },
    indigo: {
      bg: 'bg-indigo-50',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
    },
  };

  const colors = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -5,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      className={`p-6 rounded-xl border ${colors.border} ${colors.bg} relative overflow-hidden`}
    >
      {/* Animated background element */}
      <motion.div 
        className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${colors.iconBg} opacity-20`}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-lg ${colors.iconBg} ${colors.iconColor}`}>
            {icon}
          </div>
          
          {change !== undefined && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`flex items-center text-sm font-medium ${
                change > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change > 0 ? (
                <FiTrendingUp className="mr-1" />
              ) : (
                <FiTrendingDown className="mr-1" />
              )}
              {Math.abs(change)}%
            </motion.div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium tracking-wider text-gray-500 uppercase">
            {title}
          </p>
          <motion.p 
            className="mt-1 text-3xl font-bold text-gray-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {value}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;

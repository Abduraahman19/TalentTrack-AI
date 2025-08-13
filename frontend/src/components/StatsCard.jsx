import { motion } from 'framer-motion';

const StatsCard = ({ icon, title, value, change }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-6 bg-white rounded-lg shadow"
    >
      <div className="flex items-center">
        <div className="p-3 bg-gray-100 rounded-full bg-opacity-20">
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-800">{value}</p>
        </div>
      </div>
      {change && (
        <div className={`mt-2 text-sm ${
          change > 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {change > 0 ? '↑' : '↓'} {Math.abs(change)}% from last month
        </div>
      )}
    </motion.div>
  );
};

export default StatsCard;
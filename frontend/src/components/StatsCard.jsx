import { motion, useInView } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiArrowRight } from 'react-icons/fi';
import { useRef, useState } from 'react';

const StatsCard = ({ 
  icon, 
  title, 
  value, 
  change, 
  color = 'blue',
  duration,
  onClick,
  isLoading = false,
  isInteractive = false
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [isPressed, setIsPressed] = useState(false);

  // Enhanced color configurations with gradients
  const colorMap = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100/30',
      iconBg: 'bg-gradient-to-br from-blue-100 to-blue-200',
      iconColor: 'text-blue-700',
      text: 'text-blue-700',
      border: 'border-blue-200/80',
      hover: 'hover:shadow-blue-100',
      glow: 'shadow-blue-200/20',
      progress: 'bg-blue-500'
    },
    green: {
      bg: 'bg-gradient-to-br from-green-50 to-green-100/30',
      iconBg: 'bg-gradient-to-br from-green-100 to-green-200',
      iconColor: 'text-green-700',
      text: 'text-green-700',
      border: 'border-green-200/80',
      hover: 'hover:shadow-green-100',
      glow: 'shadow-green-200/20',
      progress: 'bg-green-500'
    },
    amber: {
      bg: 'bg-gradient-to-br from-amber-50 to-amber-100/30',
      iconBg: 'bg-gradient-to-br from-amber-100 to-amber-200',
      iconColor: 'text-amber-700',
      text: 'text-amber-700',
      border: 'border-amber-200/80',
      hover: 'hover:shadow-amber-100',
      glow: 'shadow-amber-200/20',
      progress: 'bg-amber-500'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-purple-100/30',
      iconBg: 'bg-gradient-to-br from-purple-100 to-purple-200',
      iconColor: 'text-purple-700',
      text: 'text-purple-700',
      border: 'border-purple-200/80',
      hover: 'hover:shadow-purple-100',
      glow: 'shadow-purple-200/20',
      progress: 'bg-purple-500'
    },
    red: {
      bg: 'bg-gradient-to-br from-red-50 to-red-100/30',
      iconBg: 'bg-gradient-to-br from-red-100 to-red-200',
      iconColor: 'text-red-700',
      text: 'text-red-700',
      border: 'border-red-200/80',
      hover: 'hover:shadow-red-100',
      glow: 'shadow-red-200/20',
      progress: 'bg-red-500'
    },
    indigo: {
      bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100/30',
      iconBg: 'bg-gradient-to-br from-indigo-100 to-indigo-200',
      iconColor: 'text-indigo-700',
      text: 'text-indigo-700',
      border: 'border-indigo-200/80',
      hover: 'hover:shadow-indigo-100',
      glow: 'shadow-indigo-200/20',
      progress: 'bg-indigo-500'
    },
  };

  const colors = colorMap[color] || colorMap.blue;

  // Animation variants for cleaner code
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      rotateX: -5
    },
    visible: { 
      opacity: 1, 
      y: 0,
      rotateX: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        mass: 0.5
      }
    },
    hover: {
      y: -8,
      rotateX: 2,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 15
      }
    },
    tap: {
      scale: 0.97,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
    }
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 12,
        delay: 0.2
      }
    }
  };

  const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({ 
      opacity: 1, 
      y: 0,
      transition: {
        delay: i * 0.1 + 0.3,
        duration: 0.4
      }
    })
  };

  const progressVariants = {
    hidden: { width: 0 },
    visible: {
      width: '100%',
      transition: {
        delay: 0.5,
        duration: duration || 1.5,
        ease: "easeOut"
      }
    }
  };

  const handleClick = () => {
    if (isInteractive && onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      whileHover={isInteractive ? "hover" : ""}
      whileTap={isInteractive ? "tap" : ""}
      onTapStart={() => setIsPressed(true)}
      onTap={() => setIsPressed(false)}
      onTapCancel={() => setIsPressed(false)}
      onClick={handleClick}
      className={`p-6 rounded-2xl border ${colors.border} ${colors.bg} relative overflow-hidden backdrop-blur-sm
        ${isInteractive ? 'cursor-pointer' : 'cursor-default'} transition-all duration-300`}
      style={{
        transform: isPressed && isInteractive ? 'translateY(2px)' : '',
      }}
    >
      {/* Animated background elements */}
      <motion.div 
        className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${colors.iconBg} opacity-30`}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1, rotate: 360 }}
        transition={{ delay: 0.2, duration: 1.5, ease: "easeOut" }}
      />
      
      <motion.div 
        className={`absolute -left-6 -bottom-6 w-20 h-20 rounded-full ${colors.iconBg} opacity-20`}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1, rotate: -360 }}
        transition={{ delay: 0.4, duration: 2, ease: "easeOut" }}
      />

      {/* Progress bar for duration-based stats */}
      {duration && (
        <motion.div 
          className="absolute top-0 left-0 h-1 rounded-full"
          variants={progressVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          style={{ background: colors.progress }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <motion.div 
            variants={iconVariants}
            className={`p-3 rounded-xl ${colors.iconBg} ${colors.iconColor} shadow-sm`}
          >
            {icon}
          </motion.div>
          
          {change !== undefined && (
            <motion.div
              variants={textVariants}
              custom={2}
              className={`flex items-center text-sm font-medium px-2 py-1 rounded-full backdrop-blur-sm
                ${change > 0 ? 'bg-green-100/70 text-green-700' : 'bg-red-100/70 text-red-700'}`}
            >
              {change > 0 ? (
                <FiTrendingUp className="mr-1" />
              ) : (
                <FiTrendingDown className="mr-1" />
              )}
              {Math.abs(change)}%
            </motion.div>
          )}

          {isInteractive && (
            <motion.div
              variants={textVariants}
              custom={3}
              className={`p-2 rounded-lg ${colors.iconBg} ${colors.iconColor} opacity-0 group-hover:opacity-100 transition-opacity`}
            >
              <FiArrowRight size={16} />
            </motion.div>
          )}
        </div>

        <div className="mt-6">
          <motion.p 
            variants={textVariants}
            custom={0}
            className="text-xs font-semibold tracking-widest text-gray-500 uppercase"
          >
            {title}
          </motion.p>
          
          {isLoading ? (
            <motion.div 
              variants={textVariants}
              custom={1}
              className="w-24 h-8 mt-3 rounded-lg bg-gray-200/50 animate-pulse"
            />
          ) : (
            <motion.p 
              variants={textVariants}
              custom={1}
              className="mt-2 text-3xl font-bold text-gray-900"
            >
              {value}
            </motion.p>
          )}
        </div>
      </div>

      {/* Subtle shine effect on hover */}
      <motion.div 
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
        animate={{
          x: isInView ? '200%' : '-100%',
        }}
        transition={{
          repeat: Infinity,
          repeatDelay: 3,
          duration: 1.5,
          ease: "easeInOut",
          delay: 1
        }}
      />
    </motion.div>
  );
};

export default StatsCard;
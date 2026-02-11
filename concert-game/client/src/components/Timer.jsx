import React from 'react';
import { motion } from 'framer-motion';
import '../styles/Timer.css';

const Timer = ({ timeLeft, totalTime }) => {
  const percentage = (timeLeft / totalTime) * 100;
  const isUrgent = timeLeft <= 3;

  return (
    <div className="timer-container">
      <div className="timer-display">
        <motion.span
          className={`timer-number ${isUrgent ? 'urgent' : ''}`}
          animate={isUrgent ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
        >
          {timeLeft}
        </motion.span>
        <span className="timer-label">сек</span>
      </div>

      <div className="timer-bar-container">
        <motion.div
          className={`timer-bar ${isUrgent ? 'urgent-bar' : ''}`}
          initial={{ width: '100%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};

export default Timer;
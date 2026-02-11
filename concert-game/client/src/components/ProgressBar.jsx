import React from 'react';
import { motion } from 'framer-motion';
import '../styles/ProgressBar.css';

const ProgressBar = ({ currentLevel, totalLevels }) => {
  return (
    <div className="progress-bar-container">
      <div className="progress-info">
        <span className="progress-text">Прогресс</span>
        <span className="progress-numbers">{currentLevel} / {totalLevels}</span>
      </div>

      <div className="progress-bar-bg">
        {[...Array(totalLevels)].map((_, index) => (
          <motion.div
            key={index}
            className={`progress-step ${index < currentLevel ? 'completed' : ''}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            {index < currentLevel ? '✓' : index + 1}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
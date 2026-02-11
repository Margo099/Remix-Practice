import React from 'react';
import { motion } from 'framer-motion';
import '../styles/AnswerButtons.css';

const AnswerButtons = ({ onAnswer, disabled }) => {
  return (
    <div className="answer-buttons">
      <motion.button
        className="answer-btn agree-btn"
        onClick={() => onAnswer('agree')}
        disabled={disabled}
        whileHover={{ scale: disabled ? 1 : 1.1 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        animate={disabled ? { opacity: 0.5 } : { opacity: 1 }}
      >
        <span className="btn-icon">��</span>
        <span className="btn-text">AGREE</span>
      </motion.button>

      <motion.button
        className="answer-btn disagree-btn"
        onClick={() => onAnswer('disagree')}
        disabled={disabled}
        whileHover={{ scale: disabled ? 1 : 1.1 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        animate={disabled ? { opacity: 0.5 } : { opacity: 1 }}
      >
        <span className="btn-icon">❌</span>
        <span className="btn-text">DISAGREE</span>
      </motion.button>
    </div>
  );
};

export default AnswerButtons;
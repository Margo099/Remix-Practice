import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/QuestionCard.css';

const QuestionCard = ({ question, hint, level }) => {
  const [showHint, setShowHint] = useState(false);

  return (
    <motion.div 
      className="question-card"
      initial={{ rotateY: 90 }}
      animate={{ rotateY: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="level-badge">Уровень {level}/7</div>
      
      <h2 className="question-text">{question}</h2>

      <div className="hint-container">
        <button 
          className="hint-button"
          onClick={() => setShowHint(!showHint)}
        >
          {showHint ? '🙈 Скрыть подсказку' : '💡 Показать подсказку'}
        </button>

        {showHint && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="hint-text"
          >
            {hint}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default QuestionCard;
import React from 'react';
import { motion } from 'framer-motion';
import '../styles/StartScreen.css';

const StartScreen = ({ onStart }) => {
  return (
    <div className="start-screen">
      <motion.div 
        className="start-content"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <motion.h1 
          className="start-title"
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          🎮 AGREE GAME 🎮
        </motion.h1>
        
        <motion.p 
          className="start-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Пройди 7 уровней и получи свой сюрприз! 💝
        </motion.p>

        <motion.div 
          className="start-rules"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p>📜 Правила:</p>
          <ul>
            <li>⏱️ Отвечай на вопросы за ограниченное время</li>
            <li>✅ Нажимай AGREE или DISAGREE</li>
            <li>🎯 Проходи все уровни подряд</li>
            <li>❤️ Не облажайся! (шучу, можно рестартовать)</li>
          </ul>
        </motion.div>

        <motion.button
          className="start-button"
          onClick={onStart}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          НАЧАТЬ ИГРУ 🚀
        </motion.button>
      </motion.div>
    </div>
  );
};

export default StartScreen;
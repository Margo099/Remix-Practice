import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import '../styles/FinalScreen.css';

const FinalScreen = ({ onRestart }) => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="final-screen">
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={true}
        numberOfPieces={300}
      />

      <motion.div
        className="final-content"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 1 }}
      >
        <motion.h1
          className="final-title"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        >
          🎉 ПОЗДРАВЛЯЮ! 🎉
        </motion.h1>

        <p className="final-message">
          Ты прошёл все уровни! 🏆
        </p>

        <motion.div
          className="ticket-envelope"
          initial={{ rotateX: 0 }}
          animate={{ rotateX: [0, 180, 0] }}
          transition={{ delay: 1, duration: 2 }}
        >
          <div className="envelope-front">
            <p>📩</p>
            <p>Твой подарок ждёт...</p>
          </div>
        </motion.div>

        <motion.div
          className="tickets-container"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3, duration: 1 }}
        >
          <h2>🎫 Электронные билеты на концерт! 🎫</h2>
          
          <div className="ticket-card">
            <div className="ticket-header">
              <span className="ticket-icon">🎵</span>
              <span className="ticket-title">КОНЦЕРТ</span>
            </div>
            <div className="ticket-details">
              <p><strong>Дата:</strong> 14 февраля 2026</p>
              <p><strong>Место:</strong> [Название площадки]</p>
              <p><strong>Время:</strong> 19:00</p>
              <p><strong>Количество:</strong> 2 билета</p>
            </div>
            <div className="ticket-qr">
              <div className="qr-placeholder">QR КОД</div>
            </div>
          </div>

          <motion.p
            className="love-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4 }}
          >
            💝 С Днём Святого Валентина, любимый! 💝
            <br />
            <small>Идём вместе наслаждаться музыкой!</small>
          </motion.p>
        </motion.div>

        <motion.button
          className="restart-btn"
          onClick={onRestart}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 5 }}
        >
          🔄 Сыграть ещё раз
        </motion.button>
      </motion.div>
    </div>
  );
};

export default FinalScreen;
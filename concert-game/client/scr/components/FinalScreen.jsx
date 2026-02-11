import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import axios from 'axios';
import '../styles/FinalScreen.css';

const FinalScreen = ({ onRestart }) => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [concertInfo, setConcertInfo] = useState(null);

  useEffect(() => {
    // Загрузка информации о билетах
    const loadConcertInfo = async () => {
      try {
        const response = await axios.get('/api/tickets/info');
        setConcertInfo(response.data);
      } catch (error) {
        console.error('Error loading concert info:', error);
      }
    };

    loadConcertInfo();

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
        colors={['#6c5ce7', '#00d2d3', '#ff006e', '#00f5a0', '#ffa502']}
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
          Ты прошёл все 7 уровней! 🏆
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

        {concertInfo && (
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
                <span className="ticket-title">{concertInfo.artist}</span>
              </div>
              
              <div className="ticket-details">
                <p><strong>📅 Дата:</strong> {concertInfo.date}</p>
                <p><strong>📍 Место:</strong> {concertInfo.venue}</p>
                <p><strong>🕐 Время:</strong> {concertInfo.time}</p>
                <p><strong>🎟️ Билетов:</strong> {concertInfo.tickets}</p>
                {concertInfo.section && (
                  <>
                    <p><strong>🪑 Сектор:</strong> {concertInfo.section}</p>
                    <p><strong>🔢 Ряд:</strong> {concertInfo.row}, Места: {concertInfo.seats}</p>
                  </>
                )}
              </div>

              <div className="ticket-qr">
                {concertInfo.qrCodeUrl ? (
                  <img 
                    src={concertInfo.qrCodeUrl} 
                    alt="QR Code"
                    className="qr-image"
                  />
                ) : (
                  <div className="qr-placeholder">QR КОД</div>
                )}
              </div>

              <div className="ticket-footer">
                <small>🎫 Код билета: VAL-2026-{Math.random().toString(36).substr(2, 9).toUpperCase()}</small>
              </div>
            </div>

            <motion.div
              className="love-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4 }}
            >
              <p style={{ whiteSpace: 'pre-line' }}>{concertInfo.personalMessage}</p>
            </motion.div>

            <motion.div
              className="action-buttons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4.5 }}
            >
              <button 
                className="download-btn"
                onClick={() => alert('Здесь будет скачивание PDF билетов 🎫')}
              >
                📥 Скачать билеты (PDF)
              </button>
            </motion.div>
          </motion.div>
        )}

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

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import QuestionCard from './QuestionCard';
import AnswerButtons from './AnswerButtons';
import Timer from './Timer';
import ProgressBar from './ProgressBar';
import '../styles/GameScreen.css';

const GameScreen = ({ currentLevel, setCurrentLevel, onComplete }) => {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isAnswering, setIsAnswering] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Загрузка вопроса для текущего уровня
  useEffect(() => {
    loadLevel(currentLevel);
  }, [currentLevel]);

  // Таймер
  useEffect(() => {
    if (!question || isAnswering || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [question, isAnswering, timeLeft]);

  const loadLevel = async (levelId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/game/level/${levelId}`);
      setQuestion(response.data);
      setTimeLeft(response.data.timeLimit);
      setFeedback(null);
      setLoading(false);
    } catch (error) {
      console.error('Error loading level:', error);
      setLoading(false);
    }
  };

  const handleAnswer = async (answer) => {
    if (isAnswering) return;

    setIsAnswering(true);

    try {
      const response = await axios.post('/api/game/validate', {
        levelId: currentLevel,
        answer: answer
      });

      if (response.data.correct) {
        // Правильный ответ
        setFeedback({ type: 'success', message: '✅ Правильно!' });

        setTimeout(() => {
          if (response.data.isLastLevel) {
            // Последний уровень - переход на финальный экран
            onComplete();
          } else {
            // Переход на следующий уровень
            setCurrentLevel(currentLevel + 1);
            setIsAnswering(false);
          }
        }, 1500);
      } else {
        // Неправильный ответ - Game Over
        setFeedback({ type: 'error', message: '❌ Неправильно! Попробуй снова' });
        
        setTimeout(() => {
          setCurrentLevel(1); // Рестарт с первого уровня
          setIsAnswering(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error validating answer:', error);
      setFeedback({ type: 'error', message: '⚠️ Ошибка сервера' });
      setIsAnswering(false);
    }
  };

  const handleTimeout = () => {
    if (isAnswering) return;
    setFeedback({ type: 'error', message: '⏰ Время вышло!' });
    setIsAnswering(true);

    setTimeout(() => {
      setCurrentLevel(1); // Рестарт
      setIsAnswering(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="game-screen loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="loader"
        >
          🎮
        </motion.div>
        <p>Загрузка уровня {currentLevel}...</p>
      </div>
    );
  }

  return (
    <div className="game-screen">
      <ProgressBar currentLevel={currentLevel} totalLevels={7} />

      <div className="game-content">
        <AnimatePresence mode="wait">
          {question && (
            <motion.div
              key={currentLevel}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="question-container"
            >
              <QuestionCard 
                question={question.question}
                hint={question.hint}
                level={currentLevel}
              />

              <Timer timeLeft={timeLeft} totalTime={question.timeLimit} />

              <AnswerButtons 
                onAnswer={handleAnswer}
                disabled={isAnswering || timeLeft === 0}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback сообщения */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`feedback feedback-${feedback.type}`}
            >
              {feedback.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GameScreen;
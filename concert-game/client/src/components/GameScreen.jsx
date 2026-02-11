import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import QuestionCard from './QuestionCard';
import AnswerButtons from './AnswerButtons';
import Timer from './Timer';
import ProgressBar from './ProgressBar';
import useSound from '../hooks/useSound';
import '../styles/GameScreen.css';

const GameScreen = ({ currentLevel, setCurrentLevel, onComplete }) => {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isAnswering, setIsAnswering] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [shake, setShake] = useState(false);

  const { playTick, playCorrect, playWrong, playVictory } = useSound();

  useEffect(() => {
    loadLevel(currentLevel);
  }, [currentLevel]);

  // Таймер с звуком
  useEffect(() => {
    if (!question || isAnswering || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        // Звук тиканья на последних 3 секундах
        if (prev <= 4) {
          playTick();
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
      setShake(false);
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
        playCorrect();
        setFeedback({ type: 'success', message: '✅ Правильно!' });

        setTimeout(() => {
          if (response.data.isLastLevel) {
            playVictory();
            onComplete();
          } else {
            setCurrentLevel(currentLevel + 1);
            setIsAnswering(false);
          }
        }, 1500);
      } else {
        playWrong();
        setShake(true);
        setFeedback({ type: 'error', message: '❌ Неправильно! Начинаем сначала...' });
        
        setTimeout(() => {
          setCurrentLevel(1);
          setIsAnswering(false);
          setShake(false);
        }, 2500);
      }
    } catch (error) {
      console.error('Error validating answer:', error);
      setFeedback({ type: 'error', message: '⚠️ Ошибка сервера' });
      setIsAnswering(false);
    }
  };

  const handleTimeout = () => {
    if (isAnswering) return;
    playWrong();
    setShake(true);
    setFeedback({ type: 'error', message: '⏰ Время вышло! Начинаем сначала...' });
    setIsAnswering(true);

    setTimeout(() => {
      setCurrentLevel(1);
      setIsAnswering(false);
      setShake(false);
    }, 2500);
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
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: shake ? [-10, 10, -10, 10, 0] : 0
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: shake ? 0.5 : 0.3 }}
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

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.8 }}
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
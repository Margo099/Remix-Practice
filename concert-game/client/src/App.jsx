import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import FinalScreen from './components/FinalScreen';
import './styles/App.css';

function App() {
  const [gameState, setGameState] = useState('start'); // start | playing | final
  const [currentLevel, setCurrentLevel] = useState(1);

  const startGame = () => {
    setGameState('playing');
    setCurrentLevel(1);
  };

  const completeGame = () => {
    setGameState('final');
  };

  const resetGame = () => {
    setGameState('start');
    setCurrentLevel(1);
  };

  return (
    <div className="app">
      <AnimatePresence mode="wait">
        {gameState === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            <StartScreen onStart={startGame} />
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <GameScreen 
              currentLevel={currentLevel}
              setCurrentLevel={setCurrentLevel}
              onComplete={completeGame}
            />
          </motion.div>
        )}

        {gameState === 'final' && (
          <motion.div
            key="final"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5 }}
          >
            <FinalScreen onRestart={resetGame} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
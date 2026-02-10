import express from 'express';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загрузка вопросов
const loadQuestions = async () => {
  const questionsPath = join(__dirname, '../data/questions.json');
  const data = await readFile(questionsPath, 'utf-8');
  return JSON.parse(data);
};

// GET /api/game/level/:id - Получить вопрос для уровня
router.get('/level/:id', async (req, res) => {
  try {
    const levelId = parseInt(req.params.id);
    const { levels } = await loadQuestions();
    
    const level = levels.find(l => l.id === levelId);
    
    if (!level) {
      return res.status(404).json({ error: 'Level not found' });
    }

    // Не отправляем правильный ответ клиенту!
    const { correctAnswer, ...levelData } = level;
    
    res.json(levelData);
  } catch (error) {
    console.error('Error loading level:', error);
    res.status(500).json({ error: 'Failed to load level' });
  }
});

// POST /api/game/validate - Проверить ответ
router.post('/validate', async (req, res) => {
  try {
    const { levelId, answer } = req.body;
    
    if (!levelId || !answer) {
      return res.status(400).json({ error: 'Missing levelId or answer' });
    }

    const { levels } = await loadQuestions();
    const level = levels.find(l => l.id === levelId);
    
    if (!level) {
      return res.status(404).json({ error: 'Level not found' });
    }

    const isCorrect = answer.toLowerCase() === level.correctAnswer.toLowerCase();
    
    res.json({ 
      correct: isCorrect,
      message: isCorrect ? '✅ Правильно!' : '❌ Неправильно!',
      isLastLevel: levelId === levels.length
    });
  } catch (error) {
    console.error('Error validating answer:', error);
    res.status(500).json({ error: 'Failed to validate answer' });
  }
});

// GET /api/game/info - Информация об игре
router.get('/info', async (req, res) => {
  try {
    const { levels } = await loadQuestions();
    res.json({
      totalLevels: levels.length,
      difficulty: ['easy', 'medium', 'hard']
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get game info' });
  }
});

export default router;
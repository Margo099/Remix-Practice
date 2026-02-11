import express from 'express';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// GET /api/tickets/info - Получить информацию о билетах
router.get('/info', async (req, res) => {
  try {
    const concertInfoPath = join(__dirname, '../data/concert-info.json');
    const data = await readFile(concertInfoPath, 'utf-8');
    const concertInfo = JSON.parse(data);
    
    res.json(concertInfo);
  } catch (error) {
    console.error('Error loading concert info:', error);
    res.status(500).json({ error: 'Failed to load concert information' });
  }
});

export default router;
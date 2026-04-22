import express from 'express';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const DATA_FILE = '/data/schedule.json';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Caduceus2024';

app.use(express.json({ limit: '10mb' }));
app.use(express.static(join(__dirname, '../dist')));

// Admin auth check
app.post('/api/auth', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false });
  }
});

// Get schedule data (public read)
app.get('/api/data', (req, res) => {
  if (existsSync(DATA_FILE)) {
    res.json(JSON.parse(readFileSync(DATA_FILE, 'utf8')));
  } else {
    res.json(null);
  }
});

// Save schedule data (admin only)
app.post('/api/data', (req, res) => {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  mkdirSync('/data', { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(req.body));
  res.json({ ok: true });
});

// SPA fallback
app.get('*splat', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

app.listen(3000, () => console.log('Medical Scheduler running on port 3000'));

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const auth = require('./middleware/auth');

const { MONGO_URI, JWT_SECRET, CLIENT_URL, PORT = 5000 } = process.env;
if (!MONGO_URI || !JWT_SECRET) {
  console.error('MONGO_URI aur JWT_SECRET environment variables zaroori hain (.env dekhein)');
  process.exit(1);
}

const app = express();
const origins = (CLIENT_URL || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true }));
app.use(express.json({ limit: '1mb' }));

// Render health check / keep-alive
app.get('/', (req, res) => res.send('LibraryPro API running'));
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', auth, require('./routes/books'));
app.use('/api/members', auth, require('./routes/members'));
app.use('/api/categories', auth, require('./routes/categories'));
app.use('/api/loans', auth, require('./routes/loans'));
app.use('/api/reservations', auth, require('./routes/reservations'));
app.use('/api/reports', auth, require('./routes/reports'));
app.use('/api/dashboard', auth, require('./routes/dashboard'));
app.use('/api/settings', auth, require('./routes/settings'));
app.use('/api/ai', auth, require('./routes/ai'));

app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors)[0].message });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

mongoose
  .connect(MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`API running on port ${PORT}`)))
  .catch((e) => {
    console.error('MongoDB connect nahi hua:', e.message);
    process.exit(1);
  });

require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// Allow comma-separated origins e.g. https://supporthome.vercel.app,http://localhost:3000
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',').map(s => s.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    // Allow all Vercel preview deployment URLs
    if (origin.match(/^https:\/\/.*\.vercel\.app$/)) return cb(null, true);
    cb(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',   require('./routes/auth'));
app.use('/api/admin',  require('./routes/admin'));
app.use('/api/client', require('./routes/client'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅  Server running on port ${PORT}`));

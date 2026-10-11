import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import pool from './db.js';
import authRoutes from './routes/auth.routes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/api/salud', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT NOW()');
    res.json({ ok: true, hora: resultado.rows[0].now });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
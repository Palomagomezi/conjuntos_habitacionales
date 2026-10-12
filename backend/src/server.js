import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import pool from './db.js';
import authRoutes from './routes/auth.routes.js';
import unidadesRoutes from './routes/unidades.routes.js';
import residentesRoutes from './routes/residentes.routes.js';
import cuotasRoutes from './routes/cuotas.routes.js';
import pagosRoutes from './routes/pagos.routes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/unidades', unidadesRoutes);
app.use('/api/residentes', residentesRoutes);
app.use('/api/cuotas', cuotasRoutes);
app.use('/api/pagos', pagosRoutes);

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
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import pool from './db.js';
import authRoutes from './routes/auth.routes.js';
import unidadesRoutes from './routes/unidades.routes.js';
import residentesRoutes from './routes/residentes.routes.js';
import cuotasRoutes from './routes/cuotas.routes.js';
import pagosRoutes from './routes/pagos.routes.js';
import egresosRoutes from './routes/egresos.routes.js';
import finanzasRoutes from './routes/finanzas.routes.js';
import avisosRoutes from './routes/avisos.routes.js';
import asambleasRoutes from './routes/asambleas.routes.js';
import votacionesRoutes from './routes/votaciones.routes.js';
import reportesRoutes from './routes/reportes.routes.js';

const app = express();

//Railway pasa las peticiones por un proxy; esto permite saber la IP real de cada usuario
app.set('trust proxy', 1);

app.use(helmet());

//En producción solo se aceptan peticiones del frontend indicado en FRONTEND_URL
const origenes = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
  : true;
app.use(cors({ origin: origenes }));

app.use(express.json());

const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { mensaje: 'Demasiados intentos, espera 15 minutos e inténtalo de nuevo' },
});

app.use('/api/auth/login', limiteAuth);
app.use('/api/auth/register', limiteAuth);

app.use('/api/auth', authRoutes);
app.use('/api/unidades', unidadesRoutes);
app.use('/api/residentes', residentesRoutes);
app.use('/api/cuotas', cuotasRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/egresos', egresosRoutes);
app.use('/api/finanzas', finanzasRoutes);
app.use('/api/avisos', avisosRoutes);
app.use('/api/asambleas', asambleasRoutes);
app.use('/api/votaciones', votacionesRoutes);
app.use('/api/reportes', reportesRoutes);

app.get('/api/salud', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT NOW()');
    res.json({ ok: true, hora: resultado.rows[0].now });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
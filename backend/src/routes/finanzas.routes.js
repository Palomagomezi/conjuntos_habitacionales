import { Router } from 'express';
import { verificarToken, soloRol } from '../middlewares/auth.middleware.js';
import {
  obtenerResumen,
  listarMovimientos,
  obtenerEstadoCuenta,
} from '../controllers/finanzas.controller.js';

const router = Router();

router.use(verificarToken);

router.get('/resumen', obtenerResumen);
router.get('/movimientos', listarMovimientos);
router.get('/estado-cuenta', soloRol('residente'), obtenerEstadoCuenta);

export default router;
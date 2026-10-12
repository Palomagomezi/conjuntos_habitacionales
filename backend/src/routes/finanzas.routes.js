import { Router } from 'express';
import { verificarToken, soloRol } from '../middlewares/auth.middleware.js';
import {
  obtenerResumen,
  listarMovimientos,
  obtenerEstadoCuenta,
} from '../controllers/finanzas.controller.js';

const router = Router();

router.use(verificarToken);

router.get('/resumen', soloRol('administrador'), obtenerResumen);
router.get('/movimientos', soloRol('administrador'), listarMovimientos);
router.get('/estado-cuenta', soloRol('residente'), obtenerEstadoCuenta);

export default router;
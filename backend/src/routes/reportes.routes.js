import { Router } from 'express';
import { verificarToken, soloRol } from '../middlewares/auth.middleware.js';
import {
  listarReportes,
  crearReporte,
  obtenerReporte,
  actualizarEstado,
} from '../controllers/reportes.controller.js';

const router = Router();

router.use(verificarToken);

router.get('/', soloRol('administrador', 'residente'), listarReportes);
router.post('/', soloRol('residente'), crearReporte);
router.get('/:id', soloRol('administrador', 'residente'), obtenerReporte);
router.put('/:id/estado', soloRol('administrador'), actualizarEstado);

export default router;
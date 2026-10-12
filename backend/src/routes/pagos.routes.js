import { Router } from 'express';
import { verificarToken, soloRol } from '../middlewares/auth.middleware.js';
import { registrarPago, listarPagos, obtenerComprobante } from '../controllers/pagos.controller.js';

const router = Router();

router.use(verificarToken);

router.get('/', soloRol('administrador'), listarPagos);
router.post('/', soloRol('administrador'), registrarPago);
router.get('/:id/comprobante', soloRol('administrador', 'residente'), obtenerComprobante);

export default router;
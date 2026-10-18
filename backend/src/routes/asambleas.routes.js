import { Router } from 'express';
import { verificarToken, soloRol } from '../middlewares/auth.middleware.js';
import {
  listarAsambleas,
  crearAsamblea,
  cerrarAsamblea,
} from '../controllers/asambleas.controller.js';

const router = Router();

router.use(verificarToken);

router.get('/', soloRol('administrador', 'residente'), listarAsambleas);
router.post('/', soloRol('administrador'), crearAsamblea);
router.put('/:id/cierre', soloRol('administrador'), cerrarAsamblea);

export default router;
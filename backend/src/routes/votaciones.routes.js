import { Router } from 'express';
import { verificarToken, soloRol } from '../middlewares/auth.middleware.js';
import {
  listarVotaciones,
  crearVotacion,
  votar,
  cerrarVotacion,
} from '../controllers/votaciones.controller.js';

const router = Router();

router.use(verificarToken);

router.get('/', soloRol('administrador', 'residente'), listarVotaciones);
router.post('/', soloRol('administrador'), crearVotacion);
router.post('/:id/votar', soloRol('residente'), votar);
router.post('/:id/cerrar', soloRol('administrador'), cerrarVotacion);

export default router;
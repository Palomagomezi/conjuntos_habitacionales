import { Router } from 'express';
import { verificarToken, soloRol } from '../middlewares/auth.middleware.js';
import {
  listarAvisos,
  crearAviso,
  eliminarAviso,
  marcarLeido,
} from '../controllers/avisos.controller.js';

const router = Router();

router.use(verificarToken);

router.get('/', soloRol('administrador', 'residente'), listarAvisos);
router.post('/', soloRol('administrador'), crearAviso);
router.delete('/:id', soloRol('administrador'), eliminarAviso);
router.post('/:id/leido', soloRol('residente'), marcarLeido);

export default router;
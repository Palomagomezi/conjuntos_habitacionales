import { Router } from 'express';
import { verificarToken, soloRol } from '../middlewares/auth.middleware.js';
import {
  listarResidentes,
  crearResidente,
  actualizarResidente,
  cambiarEstadoResidente,
  restablecerPasswordResidente,
} from '../controllers/residentes.controller.js';

const router = Router();

router.use(verificarToken, soloRol('administrador'));

router.get('/', listarResidentes);
router.post('/', crearResidente);
router.put('/:id', actualizarResidente);
router.patch('/:id/estado', cambiarEstadoResidente);
router.patch('/:id/password', restablecerPasswordResidente);

export default router;
import { Router } from 'express';
import { verificarToken, soloRol } from '../middlewares/auth.middleware.js';
import {
  listarResidentes,
  crearResidente,
  actualizarResidente,
  cambiarEstadoResidente,
} from '../controllers/residentes.controller.js';

const router = Router();

router.use(verificarToken, soloRol('administrador'));

router.get('/', listarResidentes);
router.post('/', crearResidente);
router.put('/:id', actualizarResidente);
router.patch('/:id/estado', cambiarEstadoResidente);

export default router;
import { Router } from 'express';
import { verificarToken, soloRol } from '../middlewares/auth.middleware.js';
import { listarEgresos, crearEgreso, eliminarEgreso } from '../controllers/egresos.controller.js';

const router = Router();

router.use(verificarToken, soloRol('administrador'));

router.get('/', listarEgresos);
router.post('/', crearEgreso);
router.delete('/:id', eliminarEgreso);

export default router;
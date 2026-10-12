import { Router } from 'express';
import { verificarToken, soloRol } from '../middlewares/auth.middleware.js';
import { listarCuotas, generarCuotas, eliminarCuota } from '../controllers/cuotas.controller.js';

const router = Router();

router.use(verificarToken, soloRol('administrador'));

router.get('/', listarCuotas);
router.post('/generar', generarCuotas);
router.delete('/:id', eliminarCuota);

export default router;
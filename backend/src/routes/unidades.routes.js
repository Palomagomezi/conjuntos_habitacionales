import { Router } from 'express';
import { verificarToken, soloRol } from '../middlewares/auth.middleware.js';
import {
  listarUnidades,
  crearUnidad,
  crearUnidadesLote,
  actualizarUnidad,
  eliminarUnidad,
} from '../controllers/unidades.controller.js';

const router = Router();

router.use(verificarToken, soloRol('administrador'));

router.get('/', listarUnidades);
router.post('/', crearUnidad);
router.post('/lote', crearUnidadesLote);
router.put('/:id', actualizarUnidad);
router.delete('/:id', eliminarUnidad);

export default router;
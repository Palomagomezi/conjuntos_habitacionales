import { Router } from 'express';
import { registrarAdministrador, iniciarSesion, cambiarPassword } from '../controllers/auth.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', registrarAdministrador);
router.post('/login', iniciarSesion);
router.put('/cambiar-password', verificarToken, cambiarPassword);

export default router;
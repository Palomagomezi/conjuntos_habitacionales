import { Router } from 'express';
import { registrarAdministrador, iniciarSesion } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', registrarAdministrador);
router.post('/login', iniciarSesion);

export default router;
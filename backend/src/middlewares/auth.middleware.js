import jwt from 'jsonwebtoken';
import pool from '../db.js';

export async function verificarToken(req, res, next) {
  const encabezado = req.headers.authorization;

  if (!encabezado || !encabezado.startsWith('Bearer ')) {
    return res.status(401).json({ mensaje: 'No autorizado' });
  }

  let datos;
  try {
    const token = encabezado.split(' ')[1];
    datos = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ mensaje: 'Sesión inválida o expirada' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, rol, conjunto_id, activo FROM usuarios WHERE id = $1',
      [datos.id]
    );

    if (rows.length === 0 || !rows[0].activo) {
      return res.status(401).json({ mensaje: 'Tu cuenta está desactivada' });
    }

    req.usuario = { id: rows[0].id, rol: rows[0].rol, conjunto_id: rows[0].conjunto_id };
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al verificar la sesión' });
  }
}

export function soloRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'No tienes permiso para esta acción' });
    }
    next();
  };
}
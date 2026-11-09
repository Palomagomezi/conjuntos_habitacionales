import bcrypt from 'bcryptjs';
import pool from '../db.js';

async function unidadValida(unidadId, conjuntoId) {
  if (!unidadId) return true;
  const resultado = await pool.query(
    'SELECT 1 FROM unidades WHERE id = $1 AND conjunto_id = $2',
    [unidadId, conjuntoId]
  );
  return resultado.rowCount > 0;
}

export async function listarResidentes(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT us.id, us.nombre, us.correo, us.telefono, us.activo,
              us.unidad_id, u.torre, u.numero
       FROM usuarios us
       LEFT JOIN unidades u ON u.id = us.unidad_id
       WHERE us.conjunto_id = $1 AND us.rol = 'residente'
       ORDER BY us.activo DESC, us.nombre`,
      [req.usuario.conjunto_id]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener los residentes' });
  }
}

export async function crearResidente(req, res) {
  const { nombre, correo, telefono = null, unidadId = null, passwordTemporal } = req.body;

  if (!nombre || !correo || !passwordTemporal) {
    return res.status(400).json({ mensaje: 'Nombre, correo y contraseña temporal son obligatorios' });
  }
  if (passwordTemporal.length < 8) {
    return res.status(400).json({ mensaje: 'La contraseña temporal debe tener al menos 8 caracteres' });
  }

  try {
    if (!(await unidadValida(unidadId, req.usuario.conjunto_id))) {
      return res.status(400).json({ mensaje: 'La unidad no existe en tu conjunto' });
    }

    const hash = await bcrypt.hash(passwordTemporal, 10);
    const resultado = await pool.query(
      `INSERT INTO usuarios
         (conjunto_id, unidad_id, nombre, correo, telefono, password_hash, rol, debe_cambiar_password)
       VALUES ($1, $2, $3, $4, $5, $6, 'residente', TRUE)
       RETURNING id, nombre, correo, telefono, unidad_id, activo`,
      [req.usuario.conjunto_id, unidadId, nombre, correo.toLowerCase(), telefono, hash]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Ese correo ya está registrado' });
    }
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear el residente' });
  }
}

export async function actualizarResidente(req, res) {
  const { nombre, correo, telefono = null, unidadId = null } = req.body;

  if (!nombre || !correo) {
    return res.status(400).json({ mensaje: 'Nombre y correo son obligatorios' });
  }

  try {
    if (!(await unidadValida(unidadId, req.usuario.conjunto_id))) {
      return res.status(400).json({ mensaje: 'La unidad no existe en tu conjunto' });
    }

    const resultado = await pool.query(
      `UPDATE usuarios SET nombre = $1, correo = $2, telefono = $3, unidad_id = $4
       WHERE id = $5 AND conjunto_id = $6 AND rol = 'residente'
       RETURNING id, nombre, correo, telefono, unidad_id, activo`,
      [nombre, correo.toLowerCase(), telefono, unidadId, req.params.id, req.usuario.conjunto_id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Residente no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Ese correo ya está registrado' });
    }
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar el residente' });
  }
}

export async function cambiarEstadoResidente(req, res) {
  const { activo } = req.body;

  if (typeof activo !== 'boolean') {
    return res.status(400).json({ mensaje: 'El estado debe ser true o false' });
  }

  try {
    const resultado = await pool.query(
      `UPDATE usuarios SET activo = $1
       WHERE id = $2 AND conjunto_id = $3 AND rol = 'residente'
       RETURNING id, nombre, activo`,
      [activo, req.params.id, req.usuario.conjunto_id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Residente no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al cambiar el estado del residente' });
  }
}

export async function restablecerPasswordResidente(req, res) {
  const { passwordTemporal } = req.body;

  if (!passwordTemporal || passwordTemporal.length < 8) {
    return res.status(400).json({ mensaje: 'La contraseña temporal debe tener al menos 8 caracteres' });
  }

  try {
    const hash = await bcrypt.hash(passwordTemporal, 10);
    const resultado = await pool.query(
      `UPDATE usuarios SET password_hash = $1, debe_cambiar_password = TRUE
       WHERE id = $2 AND conjunto_id = $3 AND rol = 'residente'
       RETURNING id, nombre`,
      [hash, req.params.id, req.usuario.conjunto_id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Residente no encontrado' });
    }
    res.json({ mensaje: 'Contraseña restablecida correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al restablecer la contraseña' });
  }
}
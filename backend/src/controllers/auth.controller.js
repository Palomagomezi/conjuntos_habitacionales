import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, rol: usuario.rol, conjunto_id: usuario.conjunto_id },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function datosPublicos(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    debeCambiarPassword: usuario.debe_cambiar_password,
  };
}

export async function registrarAdministrador(req, res) {
  const { nombreConjunto, nombre, correo, password } = req.body;

  if (!nombreConjunto || !nombre || !correo || !password) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
  }
  if (password.length < 8) {
    return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres' });
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const conjunto = await cliente.query(
      'INSERT INTO conjuntos (nombre) VALUES ($1) RETURNING id',
      [nombreConjunto]
    );

    const hash = await bcrypt.hash(password, 10);
    const resultado = await cliente.query(
      `INSERT INTO usuarios (conjunto_id, nombre, correo, password_hash, rol)
       VALUES ($1, $2, $3, $4, 'administrador')
       RETURNING *`,
      [conjunto.rows[0].id, nombre, correo.toLowerCase(), hash]
    );

    await cliente.query('COMMIT');
    const usuario = resultado.rows[0];
    res.status(201).json({ token: generarToken(usuario), usuario: datosPublicos(usuario) });
  } catch (error) {
    await cliente.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Ese correo ya está registrado' });
    }
    console.error(error);
    res.status(500).json({ mensaje: 'Error al registrar' });
  } finally {
    cliente.release();
  }
}

export async function iniciarSesion(req, res) {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios' });
  }

  try {
    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE correo = $1 AND activo = TRUE',
      [correo.toLowerCase()]
    );
    const usuario = resultado.rows[0];

    if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
    }

    res.json({ token: generarToken(usuario), usuario: datosPublicos(usuario) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al iniciar sesión' });
  }
}

export async function cambiarPassword(req, res) {
  const { passwordActual, passwordNueva } = req.body;

  if (!passwordActual || !passwordNueva) {
    return res.status(400).json({ mensaje: 'Ambas contraseñas son obligatorias' });
  }
  if (passwordNueva.length < 8) {
    return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 8 caracteres' });
  }

  try {
    const resultado = await pool.query(
      'SELECT password_hash FROM usuarios WHERE id = $1',
      [req.usuario.id]
    );
    const usuario = resultado.rows[0];

    if (!usuario || !(await bcrypt.compare(passwordActual, usuario.password_hash))) {
      return res.status(401).json({ mensaje: 'La contraseña actual es incorrecta' });
    }

    const hash = await bcrypt.hash(passwordNueva, 10);
    await pool.query(
      'UPDATE usuarios SET password_hash = $1, debe_cambiar_password = FALSE WHERE id = $2',
      [hash, req.usuario.id]
    );
    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al cambiar la contraseña' });
  }
}
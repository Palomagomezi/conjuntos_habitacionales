import pool from '../db.js';

const TIPOS = ['casa', 'departamento'];

export async function listarUnidades(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT u.id, u.torre, u.numero, u.tipo,
              COALESCE(string_agg(us.nombre, ', '), '') AS residentes
       FROM unidades u
       LEFT JOIN usuarios us ON us.unidad_id = u.id AND us.activo = TRUE
       WHERE u.conjunto_id = $1
       GROUP BY u.id
       ORDER BY u.torre, u.numero`,
      [req.usuario.conjunto_id]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener las unidades' });
  }
}

export async function crearUnidad(req, res) {
  const { torre = '', numero, tipo } = req.body;

  if (!numero || !TIPOS.includes(tipo)) {
    return res.status(400).json({ mensaje: 'El número y el tipo (casa o departamento) son obligatorios' });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO unidades (conjunto_id, torre, numero, tipo)
       VALUES ($1, $2, $3, $4)
       RETURNING id, torre, numero, tipo`,
      [req.usuario.conjunto_id, torre.trim(), String(numero).trim(), tipo]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Esa unidad ya existe' });
    }
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear la unidad' });
  }
}

export async function actualizarUnidad(req, res) {
  const { torre = '', numero, tipo } = req.body;

  if (!numero || !TIPOS.includes(tipo)) {
    return res.status(400).json({ mensaje: 'El número y el tipo (casa o departamento) son obligatorios' });
  }

  try {
    const resultado = await pool.query(
      `UPDATE unidades SET torre = $1, numero = $2, tipo = $3
       WHERE id = $4 AND conjunto_id = $5
       RETURNING id, torre, numero, tipo`,
      [torre.trim(), String(numero).trim(), tipo, req.params.id, req.usuario.conjunto_id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Unidad no encontrada' });
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Esa unidad ya existe' });
    }
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar la unidad' });
  }
}

export async function eliminarUnidad(req, res) {
  try {
    const resultado = await pool.query(
      'DELETE FROM unidades WHERE id = $1 AND conjunto_id = $2',
      [req.params.id, req.usuario.conjunto_id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Unidad no encontrada' });
    }
    res.json({ mensaje: 'Unidad eliminada correctamente' });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json({
        mensaje: 'No se puede eliminar: la unidad tiene cuotas registradas',
      });
    }
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar la unidad' });
  }
}
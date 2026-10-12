import pool from '../db.js';

const CATEGORIAS = ['mantenimiento', 'servicios', 'limpieza', 'seguridad', 'administracion', 'otro'];
const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function listarEgresos(req, res) {
  const { mes } = req.query;
  const parametros = [req.usuario.conjunto_id];
  let filtro = '';

  if (mes && MES.test(mes)) {
    parametros.push(mes);
    filtro = "AND to_char(fecha, 'YYYY-MM') = $2";
  }

  try {
    const resultado = await pool.query(
      `SELECT id, concepto, categoria, monto, fecha, descripcion
       FROM egresos
       WHERE conjunto_id = $1 ${filtro}
       ORDER BY fecha DESC, id DESC`,
      parametros
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener los egresos' });
  }
}

export async function crearEgreso(req, res) {
  const { concepto, categoria, monto, fecha, descripcion } = req.body;
  const cantidad = Number(monto);

  if (!concepto || !CATEGORIAS.includes(categoria) || !(cantidad > 0) || !fecha) {
    return res.status(400).json({
      mensaje: 'Concepto, categoría, monto mayor a 0 y fecha son obligatorios',
    });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO egresos (conjunto_id, concepto, categoria, monto, fecha, descripcion, registrado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, concepto, categoria, monto, fecha, descripcion`,
      [
        req.usuario.conjunto_id,
        concepto.trim(),
        categoria,
        cantidad,
        fecha,
        descripcion || null,
        req.usuario.id,
      ]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al registrar el egreso' });
  }
}

export async function eliminarEgreso(req, res) {
  try {
    const resultado = await pool.query(
      'DELETE FROM egresos WHERE id = $1 AND conjunto_id = $2',
      [req.params.id, req.usuario.conjunto_id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Egreso no encontrado' });
    }
    res.json({ mensaje: 'Egreso eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar el egreso' });
  }
}
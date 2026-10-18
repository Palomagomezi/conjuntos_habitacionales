import pool from '../db.js';

const CATEGORIAS = ['plomeria', 'electricidad', 'jardineria', 'limpieza', 'seguridad', 'estructura', 'otro'];
const PRIORIDADES = ['baja', 'media', 'alta'];
const ESTADOS = ['recibido', 'en_proceso', 'resuelto', 'rechazado'];
const CERRADOS = ['resuelto', 'rechazado'];

export async function listarReportes(req, res) {
  const { id: usuarioId, conjunto_id, rol } = req.usuario;
  const { estado } = req.query;
  const parametros = [conjunto_id];
  let filtro = '';

  if (rol === 'residente') {
    parametros.push(usuarioId);
    filtro += ` AND r.reportado_por = $${parametros.length}`;
  }
  if (ESTADOS.includes(estado)) {
    parametros.push(estado);
    filtro += ` AND r.estado = $${parametros.length}`;
  }

  try {
    const resultado = await pool.query(
      `SELECT r.id, r.titulo, r.ubicacion, r.categoria, r.prioridad, r.estado,
              r.creado_en, r.actualizado_en, un.torre, un.numero,
              u.nombre AS reportado_por
       FROM reportes r
       LEFT JOIN unidades un ON un.id = r.unidad_id
       LEFT JOIN usuarios u ON u.id = r.reportado_por
       WHERE r.conjunto_id = $1 ${filtro}
       ORDER BY (r.estado IN ('resuelto', 'rechazado')), r.creado_en DESC`,
      parametros
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener los reportes' });
  }
}

export async function crearReporte(req, res) {
  const { titulo, descripcion, ubicacion, categoria } = req.body;

  if (!titulo?.trim() || !descripcion?.trim() || !ubicacion?.trim() || !CATEGORIAS.includes(categoria)) {
    return res.status(400).json({
      mensaje: 'Título, descripción, ubicación y categoría son obligatorios',
    });
  }

  const cliente = await pool.connect();

  try {
    const usuario = await cliente.query('SELECT unidad_id FROM usuarios WHERE id = $1', [
      req.usuario.id,
    ]);

    await cliente.query('BEGIN');

    const resultado = await cliente.query(
      `INSERT INTO reportes (conjunto_id, unidad_id, reportado_por, titulo, descripcion, ubicacion, categoria)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        req.usuario.conjunto_id,
        usuario.rows[0]?.unidad_id ?? null,
        req.usuario.id,
        titulo.trim(),
        descripcion.trim(),
        ubicacion.trim(),
        categoria,
      ]
    );
    const reporteId = resultado.rows[0].id;

    await cliente.query(
      `INSERT INTO reportes_seguimiento (reporte_id, estado, comentario, registrado_por)
       VALUES ($1, 'recibido', 'Reporte registrado', $2)`,
      [reporteId, req.usuario.id]
    );

    await cliente.query('COMMIT');
    res.status(201).json({ id: reporteId, mensaje: 'Reporte enviado correctamente' });
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ mensaje: 'Error al registrar el reporte' });
  } finally {
    cliente.release();
  }
}

export async function obtenerReporte(req, res) {
  const { id: usuarioId, conjunto_id, rol } = req.usuario;

  try {
    const resultado = await pool.query(
      `SELECT r.id, r.titulo, r.descripcion, r.ubicacion, r.categoria, r.prioridad, r.estado,
              r.creado_en, r.actualizado_en, r.reportado_por AS reportado_por_id,
              un.torre, un.numero, u.nombre AS reportado_por, u.telefono
       FROM reportes r
       LEFT JOIN unidades un ON un.id = r.unidad_id
       LEFT JOIN usuarios u ON u.id = r.reportado_por
       WHERE r.id = $1 AND r.conjunto_id = $2`,
      [req.params.id, conjunto_id]
    );

    const reporte = resultado.rows[0];
    if (!reporte || (rol === 'residente' && reporte.reportado_por_id !== usuarioId)) {
      return res.status(404).json({ mensaje: 'Reporte no encontrado' });
    }

    const seguimiento = await pool.query(
      `SELECT s.id, s.estado, s.comentario, s.creado_en,
              u.nombre AS registrado_por, u.rol
       FROM reportes_seguimiento s
       LEFT JOIN usuarios u ON u.id = s.registrado_por
       WHERE s.reporte_id = $1
       ORDER BY s.creado_en, s.id`,
      [reporte.id]
    );

    res.json({ ...reporte, seguimiento: seguimiento.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener el reporte' });
  }
}

export async function actualizarEstado(req, res) {
  const { estado, comentario, prioridad } = req.body;

  if (!ESTADOS.includes(estado) || estado === 'recibido') {
    return res.status(400).json({ mensaje: 'Selecciona un estado válido' });
  }
  if (prioridad && !PRIORIDADES.includes(prioridad)) {
    return res.status(400).json({ mensaje: 'Selecciona una prioridad válida' });
  }
  if (estado === 'rechazado' && !comentario?.trim()) {
    return res.status(400).json({ mensaje: 'Indica el motivo del rechazo' });
  }

  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    const actual = await cliente.query(
      'SELECT estado FROM reportes WHERE id = $1 AND conjunto_id = $2 FOR UPDATE',
      [req.params.id, req.usuario.conjunto_id]
    );

    if (actual.rowCount === 0) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Reporte no encontrado' });
    }
    if (CERRADOS.includes(actual.rows[0].estado)) {
      await cliente.query('ROLLBACK');
      return res.status(400).json({ mensaje: 'Este reporte ya está cerrado' });
    }

    await cliente.query(
      `UPDATE reportes
       SET estado = $1, prioridad = COALESCE($2, prioridad), actualizado_en = NOW()
       WHERE id = $3`,
      [estado, prioridad || null, req.params.id]
    );

    await cliente.query(
      `INSERT INTO reportes_seguimiento (reporte_id, estado, comentario, registrado_por)
       VALUES ($1, $2, $3, $4)`,
      [req.params.id, estado, comentario?.trim() || null, req.usuario.id]
    );

    await cliente.query('COMMIT');
    res.json({ mensaje: 'Reporte actualizado correctamente' });
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar el reporte' });
  } finally {
    cliente.release();
  }
}
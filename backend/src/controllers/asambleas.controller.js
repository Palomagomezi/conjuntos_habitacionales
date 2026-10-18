import pool from '../db.js';

const TIPOS = ['ordinaria', 'extraordinaria'];
const FECHA_HORA = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

function fechaLegible(valor) {
  const [fecha, hora] = valor.replace('T', ' ').split(' ');
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio} a las ${hora.slice(0, 5)} h`;
}

export async function listarAsambleas(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT a.id, a.titulo, a.tipo, a.fecha, a.lugar, a.orden_del_dia, a.estado, a.acuerdos,
              (SELECT COUNT(*) FROM votaciones v WHERE v.asamblea_id = a.id)::int AS votaciones
       FROM asambleas a
       WHERE a.conjunto_id = $1
       ORDER BY a.fecha DESC, a.id DESC`,
      [req.usuario.conjunto_id]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener las asambleas' });
  }
}

export async function crearAsamblea(req, res) {
  const { titulo, tipo = 'ordinaria', fecha, lugar, orden_del_dia } = req.body;

  if (
    !titulo?.trim() ||
    !TIPOS.includes(tipo) ||
    !FECHA_HORA.test(fecha || '') ||
    !lugar?.trim() ||
    !orden_del_dia?.trim()
  ) {
    return res.status(400).json({
      mensaje: 'Título, tipo, fecha y hora, lugar y orden del día son obligatorios',
    });
  }

  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    const resultado = await cliente.query(
      `INSERT INTO asambleas (conjunto_id, titulo, tipo, fecha, lugar, orden_del_dia, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, titulo, tipo, fecha, lugar, orden_del_dia, estado, acuerdos`,
      [
        req.usuario.conjunto_id,
        titulo.trim(),
        tipo,
        fecha,
        lugar.trim(),
        orden_del_dia.trim(),
        req.usuario.id,
      ]
    );

    const contenido =
      `Se convoca a todos los residentes a la asamblea ${tipo} que se realizará ` +
      `el ${fechaLegible(fecha)} en ${lugar.trim()}.\n\n` +
      `Orden del día:\n${orden_del_dia.trim()}`;

    await cliente.query(
      `INSERT INTO avisos (conjunto_id, titulo, contenido, prioridad, publicado_por)
       VALUES ($1, $2, $3, 'importante', $4)`,
      [
        req.usuario.conjunto_id,
        `Convocatoria: ${titulo.trim()}`.slice(0, 150),
        contenido,
        req.usuario.id,
      ]
    );

    await cliente.query('COMMIT');
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear la asamblea' });
  } finally {
    cliente.release();
  }
}

export async function cerrarAsamblea(req, res) {
  const { estado, acuerdos } = req.body;

  if (!['realizada', 'cancelada'].includes(estado)) {
    return res.status(400).json({ mensaje: 'El estado debe ser realizada o cancelada' });
  }
  if (estado === 'realizada' && !acuerdos?.trim()) {
    return res.status(400).json({ mensaje: 'Registra los acuerdos de la asamblea' });
  }

  try {
    const resultado = await pool.query(
      `UPDATE asambleas SET estado = $1, acuerdos = $2
       WHERE id = $3 AND conjunto_id = $4 AND estado = 'programada'
       RETURNING id, titulo, estado, acuerdos`,
      [estado, acuerdos?.trim() || null, req.params.id, req.usuario.conjunto_id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Asamblea no encontrada o ya fue cerrada' });
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar la asamblea' });
  }
}
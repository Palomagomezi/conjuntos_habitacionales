import pool from '../db.js';

const FECHA_HORA = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

export async function listarVotaciones(req, res) {
  const { id: usuarioId, conjunto_id, rol } = req.usuario;

  try {
    let unidadId = null;
    if (rol === 'residente') {
      const usuario = await pool.query('SELECT unidad_id FROM usuarios WHERE id = $1', [usuarioId]);
      unidadId = usuario.rows[0]?.unidad_id ?? null;
    }

    const resultado = await pool.query(
      `SELECT v.id, v.pregunta, v.descripcion, v.fecha_cierre, v.creado_en,
              (v.cerrada OR v.fecha_cierre <= NOW()) AS cerrada,
              a.titulo AS asamblea,
              (SELECT COUNT(*) FROM votos vo WHERE vo.votacion_id = v.id)::int AS total_votos,
              (SELECT COUNT(*) FROM unidades un WHERE un.conjunto_id = v.conjunto_id)::int AS total_unidades,
              COALESCE((
                SELECT json_agg(json_build_object(
                         'id', o.id,
                         'texto', o.texto,
                         'votos', (SELECT COUNT(*) FROM votos vo WHERE vo.opcion_id = o.id)
                       ) ORDER BY o.id)
                FROM opciones_votacion o WHERE o.votacion_id = v.id
              ), '[]') AS opciones,
              (SELECT vo.opcion_id FROM votos vo
                 WHERE vo.votacion_id = v.id AND vo.unidad_id = $2) AS mi_opcion
       FROM votaciones v
       LEFT JOIN asambleas a ON a.id = v.asamblea_id
       WHERE v.conjunto_id = $1
       ORDER BY v.creado_en DESC, v.id DESC`,
      [conjunto_id, unidadId]
    );

    const votaciones = resultado.rows.map((votacion) => {
      if (rol === 'residente' && !votacion.cerrada) {
        return {
          ...votacion,
          opciones: votacion.opciones.map(({ id, texto }) => ({ id, texto, votos: null })),
        };
      }
      return votacion;
    });

    res.json(votaciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener las votaciones' });
  }
}

export async function crearVotacion(req, res) {
  const { pregunta, descripcion, fecha_cierre, asamblea_id, opciones } = req.body;
  const lista = Array.isArray(opciones)
    ? [...new Set(opciones.map((opcion) => String(opcion).trim().slice(0, 150)).filter(Boolean))]
    : [];

  if (!pregunta?.trim() || !FECHA_HORA.test(fecha_cierre || '') || lista.length < 2 || lista.length > 10) {
    return res.status(400).json({
      mensaje: 'La pregunta, la fecha de cierre y entre 2 y 10 opciones distintas son obligatorias',
    });
  }

  const cliente = await pool.connect();

  try {
    const futura = await cliente.query('SELECT $1::timestamp > NOW() AS valida', [fecha_cierre]);
    if (!futura.rows[0].valida) {
      return res.status(400).json({ mensaje: 'La fecha de cierre debe ser posterior a la fecha actual' });
    }

    if (asamblea_id) {
      const asamblea = await cliente.query(
        `SELECT id FROM asambleas
         WHERE id = $1 AND conjunto_id = $2 AND estado <> 'cancelada'`,
        [asamblea_id, req.usuario.conjunto_id]
      );
      if (asamblea.rowCount === 0) {
        return res.status(400).json({ mensaje: 'La asamblea seleccionada no es válida' });
      }
    }

    await cliente.query('BEGIN');

    const resultado = await cliente.query(
      `INSERT INTO votaciones (conjunto_id, asamblea_id, pregunta, descripcion, fecha_cierre, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        req.usuario.conjunto_id,
        asamblea_id || null,
        pregunta.trim(),
        descripcion?.trim() || null,
        fecha_cierre,
        req.usuario.id,
      ]
    );
    const votacionId = resultado.rows[0].id;

    for (const texto of lista) {
      await cliente.query(
        'INSERT INTO opciones_votacion (votacion_id, texto) VALUES ($1, $2)',
        [votacionId, texto]
      );
    }

    await cliente.query('COMMIT');
    res.status(201).json({ id: votacionId, mensaje: 'Votación creada correctamente' });
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear la votación' });
  } finally {
    cliente.release();
  }
}

export async function votar(req, res) {
  const { opcion_id } = req.body;

  try {
    const usuario = await pool.query(
      'SELECT unidad_id FROM usuarios WHERE id = $1 AND activo',
      [req.usuario.id]
    );
    const unidadId = usuario.rows[0]?.unidad_id;
    if (!unidadId) {
      return res.status(400).json({ mensaje: 'Tu cuenta no tiene una unidad asignada' });
    }

    const votacion = await pool.query(
      `SELECT (cerrada OR fecha_cierre <= NOW()) AS cerrada
       FROM votaciones WHERE id = $1 AND conjunto_id = $2`,
      [req.params.id, req.usuario.conjunto_id]
    );
    if (votacion.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Votación no encontrada' });
    }
    if (votacion.rows[0].cerrada) {
      return res.status(400).json({ mensaje: 'Esta votación ya está cerrada' });
    }

    const opcion = await pool.query(
      'SELECT id FROM opciones_votacion WHERE id = $1 AND votacion_id = $2',
      [opcion_id, req.params.id]
    );
    if (opcion.rowCount === 0) {
      return res.status(400).json({ mensaje: 'Selecciona una opción válida' });
    }

    await pool.query(
      `INSERT INTO votos (votacion_id, opcion_id, unidad_id, usuario_id)
       VALUES ($1, $2, $3, $4)`,
      [req.params.id, opcion_id, unidadId, req.usuario.id]
    );
    res.status(201).json({ mensaje: 'Tu voto fue registrado' });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Tu unidad ya emitió su voto en esta votación' });
    }
    console.error(error);
    res.status(500).json({ mensaje: 'Error al registrar el voto' });
  }
}

export async function cerrarVotacion(req, res) {
  try {
    const resultado = await pool.query(
      `UPDATE votaciones SET cerrada = TRUE
       WHERE id = $1 AND conjunto_id = $2 AND NOT cerrada AND fecha_cierre > NOW()`,
      [req.params.id, req.usuario.conjunto_id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Votación no encontrada o ya cerrada' });
    }
    res.json({ mensaje: 'Votación cerrada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al cerrar la votación' });
  }
}
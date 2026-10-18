import pool from '../db.js';

const PRIORIDADES = ['normal', 'importante', 'urgente'];

export async function listarAvisos(req, res) {
  const { id: usuarioId, conjunto_id, rol } = req.usuario;

  try {
    if (rol === 'administrador') {
      const resultado = await pool.query(
        `SELECT a.id, a.titulo, a.contenido, a.prioridad, a.creado_en,
                u.nombre AS publicado_por,
                (SELECT COUNT(*) FROM avisos_lecturas l
                   JOIN usuarios r ON r.id = l.usuario_id AND r.activo
                   WHERE l.aviso_id = a.id)::int AS lecturas,
                (SELECT COUNT(*) FROM usuarios r
                   WHERE r.conjunto_id = a.conjunto_id
                     AND r.rol = 'residente' AND r.activo)::int AS residentes
         FROM avisos a
         LEFT JOIN usuarios u ON u.id = a.publicado_por
         WHERE a.conjunto_id = $1
         ORDER BY a.creado_en DESC, a.id DESC`,
        [conjunto_id]
      );
      return res.json(resultado.rows);
    }

    const resultado = await pool.query(
      `SELECT a.id, a.titulo, a.contenido, a.prioridad, a.creado_en,
              u.nombre AS publicado_por,
              (l.usuario_id IS NOT NULL) AS leido
       FROM avisos a
       LEFT JOIN usuarios u ON u.id = a.publicado_por
       LEFT JOIN avisos_lecturas l ON l.aviso_id = a.id AND l.usuario_id = $2
       WHERE a.conjunto_id = $1
       ORDER BY a.creado_en DESC, a.id DESC`,
      [conjunto_id, usuarioId]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener los avisos' });
  }
}

export async function crearAviso(req, res) {
  const { titulo, contenido, prioridad = 'normal' } = req.body;

  if (!titulo?.trim() || !contenido?.trim() || !PRIORIDADES.includes(prioridad)) {
    return res.status(400).json({ mensaje: 'Título, contenido y prioridad válida son obligatorios' });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO avisos (conjunto_id, titulo, contenido, prioridad, publicado_por)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, titulo, contenido, prioridad, creado_en`,
      [req.usuario.conjunto_id, titulo.trim(), contenido.trim(), prioridad, req.usuario.id]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al publicar el aviso' });
  }
}

export async function eliminarAviso(req, res) {
  try {
    const resultado = await pool.query(
      'DELETE FROM avisos WHERE id = $1 AND conjunto_id = $2',
      [req.params.id, req.usuario.conjunto_id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Aviso no encontrado' });
    }
    res.json({ mensaje: 'Aviso eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar el aviso' });
  }
}

export async function marcarLeido(req, res) {
  try {
    await pool.query(
      `INSERT INTO avisos_lecturas (aviso_id, usuario_id)
       SELECT id, $2 FROM avisos WHERE id = $1 AND conjunto_id = $3
       ON CONFLICT DO NOTHING`,
      [req.params.id, req.usuario.id, req.usuario.conjunto_id]
    );
    res.json({ mensaje: 'Aviso marcado como leído' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al marcar el aviso' });
  }
}
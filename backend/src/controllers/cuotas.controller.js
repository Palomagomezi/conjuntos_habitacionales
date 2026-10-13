import pool from '../db.js';

const PERIODO = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function listarCuotas(req, res) {
  const { periodo } = req.query;
  const parametros = [req.usuario.conjunto_id];
  let filtro = '';

  if (periodo) {
    parametros.push(periodo);
    filtro = 'AND c.periodo = $2';
  }

  try {
    const resultado = await pool.query(
      `SELECT c.id, c.concepto, c.periodo, c.monto, c.fecha_limite, c.estado,
              u.id AS unidad_id, u.torre, u.numero, p.id AS pago_id,
              COALESCE(string_agg(us.nombre, ', '), '') AS residentes
       FROM cuotas c
       JOIN unidades u ON u.id = c.unidad_id
       LEFT JOIN pagos p ON p.cuota_id = c.id
       LEFT JOIN usuarios us
         ON us.unidad_id = u.id AND us.activo = TRUE AND us.rol = 'residente'
       WHERE c.conjunto_id = $1 ${filtro}
       GROUP BY c.id, u.id, p.id
       ORDER BY c.periodo DESC, u.torre, u.numero`,
      parametros
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener las cuotas' });
  }
}

export async function generarCuotas(req, res) {
  const { concepto, periodo, monto, fechaLimite } = req.body;
  const cantidad = Number(monto);

  if (!concepto || !PERIODO.test(periodo || '') || !(cantidad > 0) || !fechaLimite) {
    return res.status(400).json({
      mensaje: 'Concepto, periodo (AAAA-MM), monto mayor a 0 y fecha límite son obligatorios',
    });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO cuotas (conjunto_id, unidad_id, concepto, periodo, monto, fecha_limite)
       SELECT $1::int, id, $2, $3, $4::numeric, $5::date
       FROM unidades
       WHERE conjunto_id = $1::int
       ON CONFLICT (unidad_id, concepto, periodo) DO NOTHING
       RETURNING id`,
      [req.usuario.conjunto_id, concepto.trim(), periodo, cantidad, fechaLimite]
    );

    res.status(201).json({
      mensaje: `Se generaron ${resultado.rowCount} cuotas`,
      generadas: resultado.rowCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al generar las cuotas' });
  }
}

export async function eliminarCuota(req, res) {
  try {
    const resultado = await pool.query(
      `DELETE FROM cuotas
       WHERE id = $1 AND conjunto_id = $2 AND estado = 'pendiente'`,
      [req.params.id, req.usuario.conjunto_id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Cuota no encontrada o ya pagada' });
    }
    res.json({ mensaje: 'Cuota eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar la cuota' });
  }
}
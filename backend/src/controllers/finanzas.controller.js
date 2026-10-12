import pool from '../db.js';

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function obtenerResumen(req, res) {
  const { mes } = req.query;
  if (!MES.test(mes || '')) {
    return res.status(400).json({ mensaje: 'El mes es obligatorio (AAAA-MM)' });
  }

  const parametros = [req.usuario.conjunto_id, mes];

  try {
    const [ingresos, egresos, cuotas] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(monto), 0) AS total
         FROM pagos
         WHERE conjunto_id = $1 AND to_char(fecha_pago, 'YYYY-MM') = $2`,
        parametros
      ),
      pool.query(
        `SELECT COALESCE(SUM(monto), 0) AS total
         FROM egresos
         WHERE conjunto_id = $1 AND to_char(fecha, 'YYYY-MM') = $2`,
        parametros
      ),
      pool.query(
        `SELECT COUNT(*) FILTER (WHERE estado = 'pagada') AS pagadas,
                COUNT(*) FILTER (WHERE estado = 'pendiente') AS pendientes,
                COALESCE(SUM(monto) FILTER (WHERE estado = 'pendiente'), 0) AS por_cobrar
         FROM cuotas
         WHERE conjunto_id = $1 AND periodo = $2`,
        parametros
      ),
    ]);

    const totalIngresos = Number(ingresos.rows[0].total);
    const totalEgresos = Number(egresos.rows[0].total);

    res.json({
      mes,
      ingresos: totalIngresos,
      egresos: totalEgresos,
      balance: totalIngresos - totalEgresos,
      cuotasPagadas: Number(cuotas.rows[0].pagadas),
      cuotasPendientes: Number(cuotas.rows[0].pendientes),
      porCobrar: Number(cuotas.rows[0].por_cobrar),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener el resumen' });
  }
}

export async function listarMovimientos(req, res) {
  const { mes } = req.query;
  if (!MES.test(mes || '')) {
    return res.status(400).json({ mensaje: 'El mes es obligatorio (AAAA-MM)' });
  }

  try {
    const resultado = await pool.query(
      `SELECT 'ingreso' AS tipo, p.id, p.fecha_pago AS fecha,
              c.concepto || ' ' || c.periodo ||
                ' (' || CASE WHEN u.torre = '' THEN u.numero ELSE u.torre || '-' || u.numero END || ')'
                AS concepto,
              p.monto, co.folio AS detalle
       FROM pagos p
       JOIN cuotas c ON c.id = p.cuota_id
       JOIN unidades u ON u.id = c.unidad_id
       JOIN comprobantes co ON co.pago_id = p.id
       WHERE p.conjunto_id = $1 AND to_char(p.fecha_pago, 'YYYY-MM') = $2

       UNION ALL

       SELECT 'egreso' AS tipo, e.id, e.fecha, e.concepto, e.monto, e.categoria AS detalle
       FROM egresos e
       WHERE e.conjunto_id = $1 AND to_char(e.fecha, 'YYYY-MM') = $2

       ORDER BY fecha DESC, tipo`,
      [req.usuario.conjunto_id, mes]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener los movimientos' });
  }
}

export async function obtenerEstadoCuenta(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT c.id, c.concepto, c.periodo, c.monto, c.fecha_limite, c.estado,
              (c.estado = 'pendiente' AND c.fecha_limite < CURRENT_DATE) AS vencida,
              p.id AS pago_id, p.fecha_pago, co.folio
       FROM cuotas c
       LEFT JOIN pagos p ON p.cuota_id = c.id
       LEFT JOIN comprobantes co ON co.pago_id = p.id
       WHERE c.conjunto_id = $1
         AND c.unidad_id = (SELECT unidad_id FROM usuarios WHERE id = $2)
       ORDER BY c.periodo DESC, c.id DESC`,
      [req.usuario.conjunto_id, req.usuario.id]
    );

    const adeudo = resultado.rows
      .filter((cuota) => cuota.estado === 'pendiente')
      .reduce((suma, cuota) => suma + Number(cuota.monto), 0);

    res.json({ adeudo, cuotas: resultado.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener el estado de cuenta' });
  }
}
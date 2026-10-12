import pool from '../db.js';

const METODOS = ['efectivo', 'transferencia', 'deposito'];

export async function registrarPago(req, res) {
  const { cuotaId, metodo, referencia, fechaPago } = req.body;

  if (!cuotaId || !METODOS.includes(metodo)) {
    return res.status(400).json({
      mensaje: 'La cuota y el método de pago (efectivo, transferencia o depósito) son obligatorios',
    });
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const cuota = await cliente.query(
      `SELECT id, monto, estado FROM cuotas
       WHERE id = $1 AND conjunto_id = $2
       FOR UPDATE`,
      [cuotaId, req.usuario.conjunto_id]
    );

    if (cuota.rowCount === 0) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Cuota no encontrada' });
    }
    if (cuota.rows[0].estado === 'pagada') {
      await cliente.query('ROLLBACK');
      return res.status(409).json({ mensaje: 'Esta cuota ya fue pagada' });
    }

    const pago = await cliente.query(
      `INSERT INTO pagos (conjunto_id, cuota_id, monto, fecha_pago, metodo, referencia, registrado_por)
       VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE), $5, $6, $7)
       RETURNING id, monto, fecha_pago, metodo, referencia`,
      [
        req.usuario.conjunto_id,
        cuotaId,
        cuota.rows[0].monto,
        fechaPago || null,
        metodo,
        referencia || null,
        req.usuario.id,
      ]
    );

    await cliente.query("UPDATE cuotas SET estado = 'pagada' WHERE id = $1", [cuotaId]);

    const folio = `REC-${req.usuario.conjunto_id}-${String(pago.rows[0].id).padStart(6, '0')}`;
    await cliente.query(
      'INSERT INTO comprobantes (pago_id, folio) VALUES ($1, $2)',
      [pago.rows[0].id, folio]
    );

    await cliente.query('COMMIT');
    res.status(201).json({ ...pago.rows[0], folio });
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ mensaje: 'Error al registrar el pago' });
  } finally {
    cliente.release();
  }
}

export async function listarPagos(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT p.id, p.monto, p.fecha_pago, p.metodo, p.referencia,
              co.folio, c.concepto, c.periodo, u.torre, u.numero
       FROM pagos p
       JOIN comprobantes co ON co.pago_id = p.id
       JOIN cuotas c ON c.id = p.cuota_id
       JOIN unidades u ON u.id = c.unidad_id
       WHERE p.conjunto_id = $1
       ORDER BY p.fecha_pago DESC, p.id DESC`,
      [req.usuario.conjunto_id]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener los pagos' });
  }
}

export async function obtenerComprobante(req, res) {
  const parametros = [req.params.id, req.usuario.conjunto_id];
  let filtro = '';

  if (req.usuario.rol === 'residente') {
    parametros.push(req.usuario.id);
    filtro = 'AND c.unidad_id = (SELECT unidad_id FROM usuarios WHERE id = $3)';
  }

  try {
    const resultado = await pool.query(
      `SELECT co.folio, co.emitido_en, p.id AS pago_id, p.monto, p.fecha_pago,
              p.metodo, p.referencia, c.concepto, c.periodo,
              u.torre, u.numero, cj.nombre AS conjunto,
              COALESCE(string_agg(us.nombre, ', '), '') AS residentes
       FROM pagos p
       JOIN comprobantes co ON co.pago_id = p.id
       JOIN cuotas c ON c.id = p.cuota_id
       JOIN unidades u ON u.id = c.unidad_id
       JOIN conjuntos cj ON cj.id = p.conjunto_id
       LEFT JOIN usuarios us
         ON us.unidad_id = u.id AND us.activo = TRUE AND us.rol = 'residente'
       WHERE p.id = $1 AND p.conjunto_id = $2 ${filtro}
       GROUP BY p.id, co.id, c.id, u.id, cj.id`,
      parametros
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Comprobante no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener el comprobante' });
  }
}
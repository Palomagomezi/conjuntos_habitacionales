import { useEffect, useState } from 'react';
import { peticion } from '../../services/api';
import { SelectorMes } from '../../components/SelectorFecha';
import { dinero, formatoFecha, formatoPeriodo, mesActual } from '../../utils/formato';

const CATEGORIAS = {
  mantenimiento: 'Mantenimiento',
  servicios: 'Servicios',
  limpieza: 'Limpieza',
  seguridad: 'Seguridad',
  administracion: 'Administración',
  otro: 'Otro',
};

export default function FinanzasConjunto() {
  const [mes, setMes] = useState(mesActual());
  const [resumen, setResumen] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!mes) return;
    let activo = true;
    Promise.all([
      peticion(`/finanzas/resumen?mes=${mes}`),
      peticion(`/finanzas/movimientos?mes=${mes}`),
    ])
      .then(([datosResumen, datosMovimientos]) => {
        if (activo) {
          setResumen(datosResumen);
          setMovimientos(datosMovimientos);
          setError('');
        }
      })
      .catch((err) => {
        if (activo) setError(err.message);
      });
    return () => {
      activo = false;
    };
  }, [mes]);

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Finanzas del conjunto</h1>
          <p>Consulta los ingresos y egresos del conjunto por mes.</p>
        </div>
      </div>

      {error && <div className="mensaje-error">{error}</div>}

      <div className="filtros">
        <div className="campo">
          <label htmlFor="mes">Mes</label>
          <SelectorMes id="mes" value={mes} onChange={(e) => setMes(e.target.value)} />
        </div>
      </div>

      {resumen && (
        <div className="tarjetas-resumen">
          <div className="tarjeta">
            <p className="resumen-etiqueta">Ingresos</p>
            <p className="resumen-valor">{dinero(resumen.ingresos)}</p>
            <p className="ayuda">
              {resumen.cuotasPagadas} {resumen.cuotasPagadas === 1 ? 'cuota pagada' : 'cuotas pagadas'}
            </p>
          </div>

          <div className="tarjeta">
            <p className="resumen-etiqueta">Egresos</p>
            <p className="resumen-valor">{dinero(resumen.egresos)}</p>
            <p className="ayuda">Gastos registrados en {formatoPeriodo(resumen.mes)}</p>
          </div>

          <div className="tarjeta">
            <p className="resumen-etiqueta">Balance</p>
            <p className={`resumen-valor ${resumen.balance < 0 ? 'valor-negativo' : 'valor-positivo'}`}>
              {dinero(resumen.balance)}
            </p>
            <p className="ayuda">Ingresos menos egresos</p>
          </div>
        </div>
      )}

      <h2 className="subtitulo-seccion">Movimientos del mes</h2>

      <div className="tarjeta tabla-contenedor">
        {movimientos.length === 0 && (
          <p className="tabla-vacia">No hay movimientos registrados en este mes.</p>
        )}

        {movimientos.length > 0 && (
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Concepto</th>
                <th>Categoría</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((movimiento) => (
                <tr key={`${movimiento.tipo}-${movimiento.id}`}>
                  <td>{formatoFecha(movimiento.fecha)}</td>
                  <td>
                    {movimiento.tipo === 'ingreso' ? (
                      <span className="insignia insignia-exito">Ingreso</span>
                    ) : (
                      <span className="insignia insignia-peligro">Egreso</span>
                    )}
                  </td>
                  <td>{movimiento.concepto}</td>
                  <td>{movimiento.tipo === 'egreso' ? CATEGORIAS[movimiento.detalle] : '—'}</td>
                  <td className={movimiento.tipo === 'ingreso' ? 'valor-positivo' : 'valor-negativo'}>
                    {movimiento.tipo === 'ingreso' ? '+' : '−'} {dinero(movimiento.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
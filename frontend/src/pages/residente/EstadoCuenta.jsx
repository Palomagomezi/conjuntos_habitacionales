import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { peticion } from '../../services/api';
import { dinero, formatoFecha, formatoPeriodo } from '../../utils/formato';

export default function EstadoCuenta() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    peticion('/finanzas/estado-cuenta')
      .then((respuesta) => {
        if (activo) setDatos(respuesta);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      });
    return () => {
      activo = false;
    };
  }, []);

  if (error) return <div className="mensaje-error">{error}</div>;
  if (!datos) return <p className="texto-suave">Cargando...</p>;

  const vencidas = datos.cuotas.filter((cuota) => cuota.vencida).length;

  function insigniaEstado(cuota) {
    if (cuota.estado === 'pagada') {
      return <span className="insignia insignia-exito">Pagada</span>;
    }
    if (cuota.vencida) {
      return <span className="insignia insignia-peligro">Vencida</span>;
    }
    return <span className="insignia insignia-alerta">Pendiente</span>;
  }

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Estado de cuenta</h1>
          <p>Tus cuotas, pagos y comprobantes.</p>
        </div>
      </div>

      <div className="tarjetas-resumen">
        <div className="tarjeta">
          <p className="resumen-etiqueta">Saldo pendiente</p>
          <p className={`resumen-valor ${datos.adeudo > 0 ? 'valor-negativo' : 'valor-positivo'}`}>
            {dinero(datos.adeudo)}
          </p>
          <p className="ayuda">
            {datos.adeudo > 0 ? 'Tienes cuotas por pagar' : 'Estás al corriente'}
            {vencidas > 0 && ` · ${vencidas} ${vencidas === 1 ? 'vencida' : 'vencidas'}`}
          </p>
        </div>
      </div>

      <div className="tarjeta tabla-contenedor">
        {datos.cuotas.length === 0 && (
          <p className="tabla-vacia">Aún no tienes cuotas registradas.</p>
        )}

        {datos.cuotas.length > 0 && (
          <table className="tabla">
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Fecha límite</th>
                <th>Estado</th>
                <th>Fecha de pago</th>
                <th>Comprobante</th>
              </tr>
            </thead>
            <tbody>
              {datos.cuotas.map((cuota) => (
                <tr key={cuota.id}>
                  <td>
                    {cuota.concepto} {formatoPeriodo(cuota.periodo)}
                  </td>
                  <td>{dinero(cuota.monto)}</td>
                  <td>{formatoFecha(cuota.fecha_limite)}</td>
                  <td>{insigniaEstado(cuota)}</td>
                  <td>{cuota.fecha_pago ? formatoFecha(cuota.fecha_pago) : '—'}</td>
                  <td>
                    {cuota.pago_id ? (
                      <Link className="boton-enlace" to={`/residente/comprobante/${cuota.pago_id}`}>
                        {cuota.folio}
                      </Link>
                    ) : (
                      '—'
                    )}
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
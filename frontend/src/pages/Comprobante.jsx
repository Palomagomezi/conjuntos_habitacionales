import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { peticion } from '../services/api';
import { useAuth } from '../context/useAuth';
import { dinero, formatoFecha, formatoPeriodo, nombreUnidad } from '../utils/formato';

const METODOS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  deposito: 'Depósito',
};

export default function Comprobante() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const [comprobante, setComprobante] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    peticion(`/pagos/${id}/comprobante`)
      .then((datos) => {
        if (activo) setComprobante(datos);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      });
    return () => {
      activo = false;
    };
  }, [id]);

   const regresar = usuario.rol === 'administrador' ? '/admin/cuotas' : '/residente/estado-cuenta';

  if (error) {
    return (
      <>
        <div className="mensaje-error">{error}</div>
        <Link to={regresar} className="boton-enlace">
          ← Regresar
        </Link>
      </>
    );
  }

  if (!comprobante) {
    return <p className="texto-suave">Cargando...</p>;
  }

  return (
    <>
      <div className="encabezado no-imprimir">
        <div>
          <h1>Comprobante de pago</h1>
          <p>Folio {comprobante.folio}</p>
        </div>
        <div className="acciones-encabezado">
          <Link to={regresar} className="boton-secundario">
            Regresar
          </Link>
          <button className="boton" onClick={() => window.print()}>
            Descargar / imprimir
          </button>
        </div>
      </div>

      <div className="tarjeta comprobante">
        <div className="comprobante-encabezado">
          <div>
            <p className="comprobante-conjunto">{comprobante.conjunto}</p>
            <h2>Comprobante de pago</h2>
          </div>
          <div className="comprobante-folio">
            <span>Folio</span>
            <strong>{comprobante.folio}</strong>
          </div>
        </div>

        <dl className="comprobante-datos">
          <div>
            <dt>Unidad</dt>
            <dd>{nombreUnidad(comprobante.torre, comprobante.numero)}</dd>
          </div>
          <div>
            <dt>Residente</dt>
            <dd>{comprobante.residentes || '—'}</dd>
          </div>
          <div>
            <dt>Concepto</dt>
            <dd>
              {comprobante.concepto} {formatoPeriodo(comprobante.periodo)}
            </dd>
          </div>
          <div>
            <dt>Fecha de pago</dt>
            <dd>{formatoFecha(comprobante.fecha_pago)}</dd>
          </div>
          <div>
            <dt>Método de pago</dt>
            <dd>{METODOS[comprobante.metodo]}</dd>
          </div>
          <div>
            <dt>Referencia</dt>
            <dd>{comprobante.referencia || '—'}</dd>
          </div>
        </dl>

        <div className="comprobante-total">
          <span>Monto pagado</span>
          <strong>{dinero(comprobante.monto)}</strong>
        </div>

        <p className="ayuda">
          Emitido el {formatoFecha(comprobante.emitido_en)} a las{' '}
          {comprobante.emitido_en.slice(11, 16)} h. Este comprobante se generó
          automáticamente al registrar el pago.
        </p>
      </div>
    </>
  );
}
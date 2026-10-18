import { formatoFechaHora } from '../utils/formato';

const ESTADOS = {
  programada: { texto: 'Programada', clase: 'insignia-alerta' },
  realizada: { texto: 'Realizada', clase: 'insignia-exito' },
  cancelada: { texto: 'Cancelada', clase: 'insignia-neutra' },
};

export default function TarjetaAsamblea({ asamblea, children }) {
  const estado = ESTADOS[asamblea.estado];

  return (
    <article className="tarjeta aviso">
      <div className="aviso-encabezado">
        <h3>{asamblea.titulo}</h3>
        <div className="aviso-insignias">
          <span className="insignia">
            {asamblea.tipo === 'ordinaria' ? 'Ordinaria' : 'Extraordinaria'}
          </span>
          <span className={`insignia ${estado.clase}`}>{estado.texto}</span>
        </div>
      </div>

      <dl className="asamblea-datos">
        <div>
          <dt>Fecha</dt>
          <dd>{formatoFechaHora(asamblea.fecha)}</dd>
        </div>
        <div>
          <dt>Lugar</dt>
          <dd>{asamblea.lugar}</dd>
        </div>
        <div>
          <dt>Votaciones</dt>
          <dd>{asamblea.votaciones}</dd>
        </div>
      </dl>

      <p className="asamblea-subtitulo">Orden del día</p>
      <p className="aviso-contenido">{asamblea.orden_del_dia}</p>

      {asamblea.acuerdos && (
        <>
          <p className="asamblea-subtitulo">
            {asamblea.estado === 'cancelada' ? 'Motivo de cancelación' : 'Acuerdos'}
          </p>
          <p className="aviso-contenido asamblea-acuerdos">{asamblea.acuerdos}</p>
        </>
      )}

      {children && <div className="aviso-pie">{children}</div>}
    </article>
  );
}
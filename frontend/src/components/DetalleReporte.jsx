import { CATEGORIAS_REPORTE, ESTADOS_REPORTE, PRIORIDADES_REPORTE } from '../utils/mantenimiento';
import { formatoFechaHora, nombreUnidad } from '../utils/formato';

export default function DetalleReporte({ reporte }) {
  const estado = ESTADOS_REPORTE[reporte.estado];
  const prioridad = PRIORIDADES_REPORTE[reporte.prioridad];

  return (
    <>
      <div className="aviso-insignias detalle-insignias">
        <span className={`insignia ${estado.clase}`}>{estado.texto}</span>
        <span className={`insignia ${prioridad.clase}`}>
          Prioridad {prioridad.texto.toLowerCase()}
        </span>
        <span className="insignia insignia-neutra">{CATEGORIAS_REPORTE[reporte.categoria]}</span>
      </div>

      <h3 className="detalle-titulo">{reporte.titulo}</h3>
      <p className="aviso-contenido">{reporte.descripcion}</p>

      <dl className="asamblea-datos">
        <div>
          <dt>Ubicación</dt>
          <dd>{reporte.ubicacion}</dd>
        </div>
        <div>
          <dt>Reportó</dt>
          <dd>
            {reporte.reportado_por || '—'}
            {reporte.numero && ` · ${nombreUnidad(reporte.torre, reporte.numero)}`}
          </dd>
        </div>
        {reporte.telefono && (
          <div>
            <dt>Teléfono</dt>
            <dd>{reporte.telefono}</dd>
          </div>
        )}
      </dl>

      <p className="asamblea-subtitulo">Seguimiento</p>
      <ol className="historial">
        {reporte.seguimiento.map((paso) => (
          <li key={paso.id} className="historial-paso">
            <div className="historial-encabezado">
              <span className={`insignia ${ESTADOS_REPORTE[paso.estado].clase}`}>
                {ESTADOS_REPORTE[paso.estado].texto}
              </span>
              <span className="ayuda">{formatoFechaHora(paso.creado_en)}</span>
            </div>
            {paso.comentario && <p className="historial-comentario">{paso.comentario}</p>}
            <p className="ayuda">
              {paso.registrado_por || '—'}
              {paso.rol === 'administrador' && ' · Administración'}
            </p>
          </li>
        ))}
      </ol>
    </>
  );
}
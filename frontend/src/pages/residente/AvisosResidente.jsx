import { useEffect, useState } from 'react';
import { peticion } from '../../services/api';
import { formatoFechaHora } from '../../utils/formato';

const PRIORIDADES = {
  normal: { texto: 'Normal', clase: 'insignia-neutra' },
  importante: { texto: 'Importante', clase: 'insignia-alerta' },
  urgente: { texto: 'Urgente', clase: 'insignia-peligro' },
};

export default function AvisosResidente() {
  const [avisos, setAvisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    peticion('/avisos')
      .then((datos) => {
        if (activo) setAvisos(datos);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  async function marcarLeido(aviso) {
    try {
      await peticion(`/avisos/${aviso.id}/leido`, { metodo: 'POST' });
      setAvisos((lista) =>
        lista.map((item) => (item.id === aviso.id ? { ...item, leido: true } : item))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  const sinLeer = avisos.filter((aviso) => !aviso.leido).length;

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Avisos</h1>
          <p>
            Comunicados oficiales de la administración
            {sinLeer > 0 && ` · ${sinLeer} sin leer`}
          </p>
        </div>
      </div>

      {error && <div className="mensaje-error">{error}</div>}

      {cargando && <p className="texto-suave">Cargando...</p>}

      {!cargando && avisos.length === 0 && (
        <div className="tarjeta">
          <p className="tabla-vacia">No hay avisos publicados por el momento.</p>
        </div>
      )}

      <div className="avisos-lista">
        {avisos.map((aviso) => (
          <article
            key={aviso.id}
            className={`tarjeta aviso aviso-${aviso.prioridad} ${aviso.leido ? '' : 'aviso-nuevo'}`}
          >
            <div className="aviso-encabezado">
              <h3>{aviso.titulo}</h3>
              <div className="aviso-insignias">
                {!aviso.leido && <span className="insignia">Nuevo</span>}
                <span className={`insignia ${PRIORIDADES[aviso.prioridad].clase}`}>
                  {PRIORIDADES[aviso.prioridad].texto}
                </span>
              </div>
            </div>

            <p className="aviso-contenido">{aviso.contenido}</p>

            <div className="aviso-pie">
              <span>
                {formatoFechaHora(aviso.creado_en)} · {aviso.publicado_por || 'Administración'}
              </span>
              {aviso.leido ? (
                <span className="insignia insignia-exito">Leído</span>
              ) : (
                <button className="boton-enlace" onClick={() => marcarLeido(aviso)}>
                  Marcar como leído
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
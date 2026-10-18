import { useEffect, useState } from 'react';
import { peticion } from '../../services/api';
import ResultadosVotacion from '../../components/ResultadosVotacion';
import { formatoFechaHora } from '../../utils/formato';

export default function VotacionesResidente() {
  const [votaciones, setVotaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [seleccion, setSeleccion] = useState({});
  const [enviando, setEnviando] = useState(null);

  useEffect(() => {
    let activo = true;
    peticion('/votaciones')
      .then((datos) => {
        if (activo) setVotaciones(datos);
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
  }, [recarga]);

  async function votar(votacion) {
    const opcionId = seleccion[votacion.id];
    if (!opcionId) {
      setError('Selecciona una opción antes de votar');
      return;
    }

    const opcion = votacion.opciones.find((item) => item.id === opcionId);
    if (!window.confirm(`¿Confirmas tu voto por "${opcion.texto}"? No podrás cambiarlo.`)) {
      return;
    }

    setError('');
    setExito('');
    setEnviando(votacion.id);
    try {
      await peticion(`/votaciones/${votacion.id}/votar`, {
        metodo: 'POST',
        datos: { opcion_id: opcionId },
      });
      setExito('Tu voto fue registrado');
      setRecarga((n) => n + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(null);
    }
  }

  function textoOpcion(votacion, opcionId) {
    return votacion.opciones.find((opcion) => opcion.id === opcionId)?.texto;
  }

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Votaciones</h1>
          <p>Tu unidad tiene un voto en cada decisión del conjunto.</p>
        </div>
      </div>

      {error && <div className="mensaje-error">{error}</div>}
      {exito && <div className="mensaje-exito">{exito}</div>}

      {cargando && <p className="texto-suave">Cargando...</p>}

      {!cargando && votaciones.length === 0 && (
        <div className="tarjeta">
          <p className="tabla-vacia">No hay votaciones por el momento.</p>
        </div>
      )}

      <div className="avisos-lista">
        {votaciones.map((votacion) => (
          <article key={votacion.id} className="tarjeta aviso">
            <div className="aviso-encabezado">
              <h3>{votacion.pregunta}</h3>
              <span className={`insignia ${votacion.cerrada ? 'insignia-neutra' : 'insignia-exito'}`}>
                {votacion.cerrada ? 'Cerrada' : 'Abierta'}
              </span>
            </div>

            {votacion.descripcion && <p className="aviso-contenido">{votacion.descripcion}</p>}

            <p className="ayuda votacion-datos">
              {votacion.asamblea && `Asamblea: ${votacion.asamblea} · `}
              Fecha de cierre: {formatoFechaHora(votacion.fecha_cierre)}
            </p>

            {votacion.cerrada && (
              <ResultadosVotacion
                opciones={votacion.opciones}
                totalVotos={votacion.total_votos}
                miOpcion={votacion.mi_opcion}
              />
            )}

            {!votacion.cerrada && votacion.mi_opcion && (
              <p className="voto-emitido">
                Tu unidad votó por <strong>{textoOpcion(votacion, votacion.mi_opcion)}</strong>. Los
                resultados se mostrarán cuando cierre la votación.
              </p>
            )}

            {!votacion.cerrada && !votacion.mi_opcion && (
              <>
                <div className="opciones-voto">
                  {votacion.opciones.map((opcion) => (
                    <label key={opcion.id} className="opcion-voto">
                      <input
                        type="radio"
                        name={`votacion-${votacion.id}`}
                        checked={seleccion[votacion.id] === opcion.id}
                        onChange={() => setSeleccion({ ...seleccion, [votacion.id]: opcion.id })}
                      />
                      {opcion.texto}
                    </label>
                  ))}
                </div>
                <button
                  className="boton"
                  onClick={() => votar(votacion)}
                  disabled={enviando === votacion.id}
                >
                  {enviando === votacion.id ? 'Enviando...' : 'Emitir voto'}
                </button>
              </>
            )}

            <div className="aviso-pie votacion-datos">
              <span>
                Participación: {votacion.total_votos} de {votacion.total_unidades} unidades
              </span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
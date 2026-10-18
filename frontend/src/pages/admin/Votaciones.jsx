import { useEffect, useState } from 'react';
import { peticion } from '../../services/api';
import Modal from '../../components/Modal';
import ResultadosVotacion from '../../components/ResultadosVotacion';
import { ahoraLocal, formatoFechaHora } from '../../utils/formato';

function formVacio() {
  return { pregunta: '', descripcion: '', asamblea_id: '', fecha_cierre: '', opciones: ['', ''] };
}

export default function Votaciones() {
  const [votaciones, setVotaciones] = useState([]);
  const [asambleas, setAsambleas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [recarga, setRecarga] = useState(0);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(formVacio());
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;
    Promise.all([peticion('/votaciones'), peticion('/asambleas')])
      .then(([listaVotaciones, listaAsambleas]) => {
        if (!activo) return;
        setVotaciones(listaVotaciones);
        setAsambleas(listaAsambleas.filter((asamblea) => asamblea.estado !== 'cancelada'));
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

  function abrirNueva() {
    setForm(formVacio());
    setErrorForm('');
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setErrorForm('');
  }

  function actualizar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function actualizarOpcion(indice, valor) {
    setForm({
      ...form,
      opciones: form.opciones.map((opcion, i) => (i === indice ? valor : opcion)),
    });
  }

  function agregarOpcion() {
    if (form.opciones.length < 10) {
      setForm({ ...form, opciones: [...form.opciones, ''] });
    }
  }

  function quitarOpcion(indice) {
    setForm({ ...form, opciones: form.opciones.filter((_, i) => i !== indice) });
  }

  async function guardar(e) {
    e.preventDefault();
    setErrorForm('');
    setExito('');
    setGuardando(true);

    try {
      await peticion('/votaciones', {
        metodo: 'POST',
        datos: { ...form, asamblea_id: form.asamblea_id ? Number(form.asamblea_id) : null },
      });
      setExito('Votación creada correctamente');
      setModalAbierto(false);
      setRecarga((n) => n + 1);
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function cerrar(votacion) {
    if (!window.confirm(`¿Cerrar la votación "${votacion.pregunta}"? Ya no se podrán emitir votos.`)) {
      return;
    }

    setError('');
    setExito('');
    try {
      await peticion(`/votaciones/${votacion.id}/cerrar`, { metodo: 'POST' });
      setExito('Votación cerrada correctamente');
      setRecarga((n) => n + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Votaciones</h1>
          <p>Decisiones del conjunto. Cada unidad tiene un voto.</p>
        </div>
        <button className="boton" onClick={abrirNueva}>
          + Nueva votación
        </button>
      </div>

      {error && <div className="mensaje-error">{error}</div>}
      {exito && <div className="mensaje-exito">{exito}</div>}

      {cargando && <p className="texto-suave">Cargando...</p>}

      {!cargando && votaciones.length === 0 && (
        <div className="tarjeta">
          <p className="tabla-vacia">Aún no has creado votaciones.</p>
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

            <ResultadosVotacion opciones={votacion.opciones} totalVotos={votacion.total_votos} />

            <div className="aviso-pie">
              <span>
                Participación: {votacion.total_votos} de {votacion.total_unidades} unidades
              </span>
              {!votacion.cerrada && (
                <button className="boton-enlace peligro" onClick={() => cerrar(votacion)}>
                  Cerrar votación
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {modalAbierto && (
        <Modal titulo="Nueva votación" onCerrar={cerrarModal}>
          <form onSubmit={guardar}>
            {errorForm && <div className="mensaje-error">{errorForm}</div>}

            <div className="campo">
              <label htmlFor="pregunta">Pregunta</label>
              <input
                id="pregunta"
                name="pregunta"
                value={form.pregunta}
                onChange={actualizar}
                placeholder="Ej. ¿Se aprueba la pintura de fachadas?"
                maxLength={255}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="descripcion">Descripción (opcional)</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={form.descripcion}
                onChange={actualizar}
                placeholder="Costo, proveedor u otros detalles"
              />
            </div>

            <div className="campo">
              <label htmlFor="asamblea_id">Asamblea (opcional)</label>
              <select
                id="asamblea_id"
                name="asamblea_id"
                value={form.asamblea_id}
                onChange={actualizar}
              >
                <option value="">Sin asamblea</option>
                {asambleas.map((asamblea) => (
                  <option key={asamblea.id} value={asamblea.id}>
                    {asamblea.titulo}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="fecha_cierre">Fecha y hora de cierre</label>
              <input
                id="fecha_cierre"
                name="fecha_cierre"
                type="datetime-local"
                min={ahoraLocal()}
                value={form.fecha_cierre}
                onChange={actualizar}
                required
              />
            </div>

            <div className="campo">
              <label>Opciones</label>
              {form.opciones.map((opcion, indice) => (
                <div key={indice} className="opcion-fila">
                  <input
                    value={opcion}
                    onChange={(e) => actualizarOpcion(indice, e.target.value)}
                    placeholder={`Opción ${indice + 1}`}
                    maxLength={150}
                    required
                  />
                  {form.opciones.length > 2 && (
                    <button
                      type="button"
                      className="boton-enlace peligro"
                      onClick={() => quitarOpcion(indice)}
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ))}
              {form.opciones.length < 10 && (
                <button type="button" className="boton-enlace" onClick={agregarOpcion}>
                  + Agregar opción
                </button>
              )}
            </div>

            <div className="modal-acciones">
              <button type="button" className="boton-secundario" onClick={cerrarModal}>
                Cancelar
              </button>
              <button type="submit" className="boton" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Crear votación'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
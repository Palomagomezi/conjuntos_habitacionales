import { useEffect, useState } from 'react';
import { peticion } from '../../services/api';
import Modal from '../../components/Modal';
import { formatoFechaHora } from '../../utils/formato';

const PRIORIDADES = {
  normal: { texto: 'Normal', clase: 'insignia-neutra' },
  importante: { texto: 'Importante', clase: 'insignia-alerta' },
  urgente: { texto: 'Urgente', clase: 'insignia-peligro' },
};

function formVacio() {
  return { titulo: '', contenido: '', prioridad: 'normal' };
}

export default function Avisos() {
  const [avisos, setAvisos] = useState([]);
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
  }, [recarga]);

  function abrirNuevo() {
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

  async function guardar(e) {
    e.preventDefault();
    setErrorForm('');
    setExito('');
    setGuardando(true);

    try {
      await peticion('/avisos', { metodo: 'POST', datos: form });
      setExito('Aviso publicado correctamente');
      setModalAbierto(false);
      setRecarga((n) => n + 1);
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(aviso) {
    if (!window.confirm(`¿Eliminar el aviso "${aviso.titulo}"? Los residentes ya no podrán verlo.`)) {
      return;
    }

    setError('');
    setExito('');
    try {
      await peticion(`/avisos/${aviso.id}`, { metodo: 'DELETE' });
      setExito('Aviso eliminado correctamente');
      setRecarga((n) => n + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Avisos</h1>
          <p>Comunicados oficiales para los residentes del conjunto.</p>
        </div>
        <button className="boton" onClick={abrirNuevo}>
          + Publicar aviso
        </button>
      </div>

      {error && <div className="mensaje-error">{error}</div>}
      {exito && <div className="mensaje-exito">{exito}</div>}

      {cargando && <p className="texto-suave">Cargando...</p>}

      {!cargando && avisos.length === 0 && (
        <div className="tarjeta">
          <p className="tabla-vacia">Aún no has publicado avisos.</p>
        </div>
      )}

      <div className="avisos-lista">
        {avisos.map((aviso) => (
          <article key={aviso.id} className={`tarjeta aviso aviso-${aviso.prioridad}`}>
            <div className="aviso-encabezado">
              <h3>{aviso.titulo}</h3>
              <span className={`insignia ${PRIORIDADES[aviso.prioridad].clase}`}>
                {PRIORIDADES[aviso.prioridad].texto}
              </span>
            </div>

            <p className="aviso-contenido">{aviso.contenido}</p>

            <div className="aviso-pie">
              <span>
                {formatoFechaHora(aviso.creado_en)} · {aviso.publicado_por || 'Administración'}
              </span>
              <span>
                Leído por {aviso.lecturas} de {aviso.residentes} residentes
              </span>
              <button className="boton-enlace peligro" onClick={() => eliminar(aviso)}>
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>

      {modalAbierto && (
        <Modal titulo="Publicar aviso" onCerrar={cerrarModal}>
          <form onSubmit={guardar}>
            {errorForm && <div className="mensaje-error">{errorForm}</div>}

            <div className="campo">
              <label htmlFor="titulo">Título</label>
              <input
                id="titulo"
                name="titulo"
                value={form.titulo}
                onChange={actualizar}
                placeholder="Ej. Corte de agua programado"
                maxLength={150}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="prioridad">Prioridad</label>
              <select id="prioridad" name="prioridad" value={form.prioridad} onChange={actualizar}>
                {Object.entries(PRIORIDADES).map(([valor, { texto }]) => (
                  <option key={valor} value={valor}>
                    {texto}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="contenido">Contenido</label>
              <textarea
                id="contenido"
                name="contenido"
                rows={6}
                value={form.contenido}
                onChange={actualizar}
                placeholder="Escribe el aviso completo para los residentes"
                required
              />
            </div>

            <div className="modal-acciones">
              <button type="button" className="boton-secundario" onClick={cerrarModal}>
                Cancelar
              </button>
              <button type="submit" className="boton" disabled={guardando}>
                {guardando ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
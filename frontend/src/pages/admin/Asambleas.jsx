import { useEffect, useState } from 'react';
import { peticion } from '../../services/api';
import Modal from '../../components/Modal';
import TarjetaAsamblea from '../../components/TarjetaAsamblea';
import { ahoraLocal } from '../../utils/formato';

function formVacio() {
  return { titulo: '', tipo: 'ordinaria', fecha: '', lugar: '', orden_del_dia: '' };
}

export default function Asambleas() {
  const [asambleas, setAsambleas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [recarga, setRecarga] = useState(0);

  const [modalNueva, setModalNueva] = useState(false);
  const [form, setForm] = useState(formVacio());
  const [cierre, setCierre] = useState(null);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;
    peticion('/asambleas')
      .then((datos) => {
        if (activo) setAsambleas(datos);
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
    setModalNueva(true);
  }

  function abrirCierre(asamblea, estado) {
    setCierre({ asamblea, estado, acuerdos: '' });
    setErrorForm('');
  }

  function cerrarModales() {
    setModalNueva(false);
    setCierre(null);
    setErrorForm('');
  }

  function actualizar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function convocar(e) {
    e.preventDefault();
    setErrorForm('');
    setExito('');
    setGuardando(true);

    try {
      await peticion('/asambleas', { metodo: 'POST', datos: form });
      setExito('Asamblea convocada. La convocatoria se publicó en Avisos.');
      setModalNueva(false);
      setRecarga((n) => n + 1);
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function guardarCierre(e) {
    e.preventDefault();
    setErrorForm('');
    setExito('');
    setGuardando(true);

    try {
      await peticion(`/asambleas/${cierre.asamblea.id}/cierre`, {
        metodo: 'PUT',
        datos: { estado: cierre.estado, acuerdos: cierre.acuerdos },
      });
      setExito(
        cierre.estado === 'realizada' ? 'Acuerdos registrados correctamente' : 'Asamblea cancelada'
      );
      setCierre(null);
      setRecarga((n) => n + 1);
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Asambleas</h1>
          <p>Convoca asambleas y registra los acuerdos tomados.</p>
        </div>
        <button className="boton" onClick={abrirNueva}>
          + Convocar asamblea
        </button>
      </div>

      {error && <div className="mensaje-error">{error}</div>}
      {exito && <div className="mensaje-exito">{exito}</div>}

      {cargando && <p className="texto-suave">Cargando...</p>}

      {!cargando && asambleas.length === 0 && (
        <div className="tarjeta">
          <p className="tabla-vacia">Aún no has convocado asambleas.</p>
        </div>
      )}

      <div className="avisos-lista">
        {asambleas.map((asamblea) => (
          <TarjetaAsamblea key={asamblea.id} asamblea={asamblea}>
            {asamblea.estado === 'programada' && (
              <>
                <button className="boton-enlace" onClick={() => abrirCierre(asamblea, 'realizada')}>
                  Registrar acuerdos
                </button>
                <button
                  className="boton-enlace peligro"
                  onClick={() => abrirCierre(asamblea, 'cancelada')}
                >
                  Cancelar asamblea
                </button>
              </>
            )}
          </TarjetaAsamblea>
        ))}
      </div>

      {modalNueva && (
        <Modal titulo="Convocar asamblea" onCerrar={cerrarModales}>
          <form onSubmit={convocar}>
            {errorForm && <div className="mensaje-error">{errorForm}</div>}

            <div className="campo">
              <label htmlFor="titulo">Título</label>
              <input
                id="titulo"
                name="titulo"
                value={form.titulo}
                onChange={actualizar}
                placeholder="Ej. Asamblea ordinaria de noviembre"
                maxLength={130}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="tipo">Tipo</label>
              <select id="tipo" name="tipo" value={form.tipo} onChange={actualizar}>
                <option value="ordinaria">Ordinaria</option>
                <option value="extraordinaria">Extraordinaria</option>
              </select>
            </div>

            <div className="campo">
              <label htmlFor="fecha">Fecha y hora</label>
              <input
                id="fecha"
                name="fecha"
                type="datetime-local"
                min={ahoraLocal()}
                value={form.fecha}
                onChange={actualizar}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="lugar">Lugar</label>
              <input
                id="lugar"
                name="lugar"
                value={form.lugar}
                onChange={actualizar}
                placeholder="Ej. Casa club"
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="orden_del_dia">Orden del día</label>
              <textarea
                id="orden_del_dia"
                name="orden_del_dia"
                rows={5}
                value={form.orden_del_dia}
                onChange={actualizar}
                placeholder={'1. Lista de asistencia\n2. ...'}
                required
              />
            </div>

            <p className="ayuda">Al guardar se publicará la convocatoria en Avisos.</p>

            <div className="modal-acciones">
              <button type="button" className="boton-secundario" onClick={cerrarModales}>
                Cancelar
              </button>
              <button type="submit" className="boton" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Convocar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {cierre && (
        <Modal
          titulo={cierre.estado === 'realizada' ? 'Registrar acuerdos' : 'Cancelar asamblea'}
          onCerrar={cerrarModales}
        >
          <form onSubmit={guardarCierre}>
            {errorForm && <div className="mensaje-error">{errorForm}</div>}

            <p className="texto-suave">{cierre.asamblea.titulo}</p>

            <div className="campo">
              <label htmlFor="acuerdos">
                {cierre.estado === 'realizada' ? 'Acuerdos tomados' : 'Motivo (opcional)'}
              </label>
              <textarea
                id="acuerdos"
                rows={6}
                value={cierre.acuerdos}
                onChange={(e) => setCierre({ ...cierre, acuerdos: e.target.value })}
                required={cierre.estado === 'realizada'}
              />
            </div>

            <p className="ayuda">Una vez guardado, este registro ya no se podrá modificar.</p>

            <div className="modal-acciones">
              <button type="button" className="boton-secundario" onClick={cerrarModales}>
                Regresar
              </button>
              <button type="submit" className="boton" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
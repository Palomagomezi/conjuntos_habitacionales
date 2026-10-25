import { useEffect, useState } from 'react';
import { peticion } from '../../services/api';
import Modal from '../../components/Modal';

const FORM_VACIO = { torre: '', numero: '', tipo: 'casa' };
const LOTE_VACIO = { torre: '', desde: '1', hasta: '', tipo: 'casa' };

export default function Unidades() {
  const [unidades, setUnidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const [loteAbierto, setLoteAbierto] = useState(false);
  const [lote, setLote] = useState(LOTE_VACIO);
  const [errorLote, setErrorLote] = useState('');

  useEffect(() => {
    let activo = true;
    peticion('/unidades')
      .then((datos) => {
        if (activo) setUnidades(datos);
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

  function recargar() {
    setRecarga((n) => n + 1);
  }

  function abrirNueva() {
    setForm(FORM_VACIO);
    setEditandoId(null);
    setErrorForm('');
    setModalAbierto(true);
  }

  function abrirEditar(unidad) {
    setForm({ torre: unidad.torre, numero: unidad.numero, tipo: unidad.tipo });
    setEditandoId(unidad.id);
    setErrorForm('');
    setModalAbierto(true);
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
      if (editandoId) {
        await peticion(`/unidades/${editandoId}`, { metodo: 'PUT', datos: form });
        setExito('Unidad actualizada correctamente');
      } else {
        await peticion('/unidades', { metodo: 'POST', datos: form });
        setExito('Unidad creada correctamente');
      }
      setModalAbierto(false);
      recargar();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  function abrirLote() {
    setLote(LOTE_VACIO);
    setErrorLote('');
    setLoteAbierto(true);
  }

  function actualizarLote(e) {
    setLote({ ...lote, [e.target.name]: e.target.value });
  }

  async function guardarLote(e) {
    e.preventDefault();
    setErrorLote('');
    setExito('');
    setGuardando(true);

    try {
      const r = await peticion('/unidades/lote', { metodo: 'POST', datos: lote });
      setExito(
        r.omitidas > 0
          ? `Se crearon ${r.creadas} unidades (${r.omitidas} ya existían)`
          : `Se crearon ${r.creadas} unidades`
      );
      setLoteAbierto(false);
      recargar();
    } catch (err) {
      setErrorLote(err.message);
    } finally {
      setGuardando(false);
    }
  }

  const cantidadLote =
    Number(lote.hasta) >= Number(lote.desde) && Number(lote.desde) >= 1
      ? Number(lote.hasta) - Number(lote.desde) + 1
      : 0;

  async function eliminar(unidad) {
    const nombre = unidad.torre ? `${unidad.torre}-${unidad.numero}` : unidad.numero;
    const confirmado = window.confirm(
      `¿Eliminar la unidad ${nombre}? Sus residentes quedarán sin unidad asignada.`
    );
    if (!confirmado) return;

    setError('');
    setExito('');
    try {
      await peticion(`/unidades/${unidad.id}`, { metodo: 'DELETE' });
      setExito('Unidad eliminada correctamente');
      recargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Unidades</h1>
          <p>Casas o departamentos registrados en tu conjunto.</p>
        </div>
        <div className="encabezado-acciones">
          <button className="boton-secundario" onClick={abrirLote}>
            + Varias unidades
          </button>
          <button className="boton" onClick={abrirNueva}>
            + Nueva unidad
          </button>
        </div>
      </div>

      {error && <div className="mensaje-error">{error}</div>}
      {exito && <div className="mensaje-exito">{exito}</div>}

      <div className="tarjeta tabla-contenedor">
        {cargando && <p className="tabla-vacia">Cargando...</p>}

        {!cargando && unidades.length === 0 && (
          <p className="tabla-vacia">Aún no hay unidades registradas.</p>
        )}

        {!cargando && unidades.length > 0 && (
          <table className="tabla">
            <thead>
              <tr>
                <th>Torre / bloque</th>
                <th>Número</th>
                <th>Tipo</th>
                <th>Residentes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {unidades.map((unidad) => (
                <tr key={unidad.id}>
                  <td>{unidad.torre || '—'}</td>
                  <td>{unidad.numero}</td>
                  <td>
                    <span className="insignia">
                      {unidad.tipo === 'casa' ? 'Casa' : 'Departamento'}
                    </span>
                  </td>
                  <td>
                    {unidad.residentes || <span className="texto-suave">Sin residentes</span>}
                  </td>
                  <td className="tabla-acciones">
                    <button className="boton-enlace" onClick={() => abrirEditar(unidad)}>
                      Editar
                    </button>
                    <button className="boton-enlace peligro" onClick={() => eliminar(unidad)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <Modal
          titulo={editandoId ? 'Editar unidad' : 'Nueva unidad'}
          onCerrar={() => setModalAbierto(false)}
        >
          <form onSubmit={guardar}>
            {errorForm && <div className="mensaje-error">{errorForm}</div>}

            <div className="campo">
              <label htmlFor="torre">Torre o bloque (opcional)</label>
              <input id="torre" name="torre" value={form.torre} onChange={actualizar} />
            </div>

            <div className="campo">
              <label htmlFor="numero">Número</label>
              <input id="numero" name="numero" value={form.numero} onChange={actualizar} required />
            </div>

            <div className="campo">
              <label htmlFor="tipo">Tipo</label>
              <select id="tipo" name="tipo" value={form.tipo} onChange={actualizar}>
                <option value="casa">Casa</option>
                <option value="departamento">Departamento</option>
              </select>
            </div>

            <div className="modal-acciones">
              <button
                type="button"
                className="boton-secundario"
                onClick={() => setModalAbierto(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="boton" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {loteAbierto && (
        <Modal titulo="Crear varias unidades" onCerrar={() => setLoteAbierto(false)}>
          <form onSubmit={guardarLote}>
            {errorLote && <div className="mensaje-error">{errorLote}</div>}

            <div className="campo">
              <label htmlFor="lote-torre">Torre o bloque (opcional)</label>
              <input id="lote-torre" name="torre" value={lote.torre} onChange={actualizarLote} />
            </div>

            <div className="campo">
              <label htmlFor="lote-desde">Desde el número</label>
              <input
                id="lote-desde"
                name="desde"
                type="number"
                min="1"
                value={lote.desde}
                onChange={actualizarLote}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="lote-hasta">Hasta el número</label>
              <input
                id="lote-hasta"
                name="hasta"
                type="number"
                min="1"
                value={lote.hasta}
                onChange={actualizarLote}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="lote-tipo">Tipo</label>
              <select id="lote-tipo" name="tipo" value={lote.tipo} onChange={actualizarLote}>
                <option value="casa">Casa</option>
                <option value="departamento">Departamento</option>
              </select>
            </div>

            {cantidadLote > 0 && (
              <p className="texto-suave">Se crearán {cantidadLote} unidades.</p>
            )}

            <div className="modal-acciones">
              <button
                type="button"
                className="boton-secundario"
                onClick={() => setLoteAbierto(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="boton" disabled={guardando}>
                {guardando ? 'Creando...' : 'Crear unidades'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
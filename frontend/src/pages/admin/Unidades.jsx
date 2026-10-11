import { useEffect, useState } from 'react';
import { peticion } from '../../services/api';
import Modal from '../../components/Modal';

const FORM_VACIO = { torre: '', numero: '', tipo: 'casa' };

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
        <button className="boton" onClick={abrirNueva}>
          + Nueva unidad
        </button>
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
    </>
  );
}
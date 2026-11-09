import { useEffect, useState } from 'react';
import { peticion } from '../../services/api';
import Modal from '../../components/Modal';

const FORM_VACIO = {
  nombre: '',
  correo: '',
  telefono: '',
  unidadId: '',
  passwordTemporal: '',
};

function nombreUnidad(torre, numero) {
  if (!numero) return null;
  return torre ? `${torre}-${numero}` : numero;
}

export default function Residentes() {
  const [residentes, setResidentes] = useState([]);
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
    Promise.all([peticion('/residentes'), peticion('/unidades')])
      .then(([listaResidentes, listaUnidades]) => {
        if (activo) {
          setResidentes(listaResidentes);
          setUnidades(listaUnidades);
        }
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

  function abrirNuevo() {
    setForm(FORM_VACIO);
    setEditandoId(null);
    setErrorForm('');
    setModalAbierto(true);
  }

  function abrirEditar(residente) {
    setForm({
      nombre: residente.nombre,
      correo: residente.correo,
      telefono: residente.telefono || '',
      unidadId: residente.unidad_id ? String(residente.unidad_id) : '',
      passwordTemporal: '',
    });
    setEditandoId(residente.id);
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

    const datos = {
      nombre: form.nombre,
      correo: form.correo,
      telefono: form.telefono || null,
      unidadId: form.unidadId ? Number(form.unidadId) : null,
    };

    try {
      if (editandoId) {
        await peticion(`/residentes/${editandoId}`, { metodo: 'PUT', datos });
        setExito('Residente actualizado correctamente');
      } else {
        await peticion('/residentes', {
          metodo: 'POST',
          datos: { ...datos, passwordTemporal: form.passwordTemporal },
        });
        setExito(
          `Residente creado. Comparte con ${form.nombre} su correo y la contraseña temporal; se le pedirá cambiarla al entrar.`
        );
      }
      setModalAbierto(false);
      recargar();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(residente) {
    const mensaje = residente.activo
      ? `¿Dar de baja a ${residente.nombre}? Ya no podrá iniciar sesión, pero su historial se conservará.`
      : `¿Reactivar a ${residente.nombre}? Podrá volver a iniciar sesión.`;
    if (!window.confirm(mensaje)) return;

    setError('');
    setExito('');
    try {
      await peticion(`/residentes/${residente.id}/estado`, {
        metodo: 'PATCH',
        datos: { activo: !residente.activo },
      });
      setExito(residente.activo ? 'Residente dado de baja' : 'Residente reactivado');
      recargar();
    } catch (err) {
      setError(err.message);
    }
  }
  async function restablecerPassword(residente) {
    const nueva = window.prompt(
      `Escribe una contraseña temporal para ${residente.nombre} (mínimo 8 caracteres). Se le pedirá cambiarla al entrar.`
    );
    if (nueva === null) return;
    if (nueva.length < 8) {
      setError('La contraseña temporal debe tener al menos 8 caracteres');
      return;
    }

    setError('');
    setExito('');
    try {
      await peticion(`/residentes/${residente.id}/password`, {
        metodo: 'PATCH',
        datos: { passwordTemporal: nueva },
      });
      setExito(
        `Contraseña restablecida. Comparte con ${residente.nombre} la contraseña temporal; se le pedirá cambiarla al entrar.`
      );
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Residentes</h1>
          <p>Cuentas de los residentes de tu conjunto.</p>
        </div>
        <button className="boton" onClick={abrirNuevo}>
          + Nuevo residente
        </button>
      </div>

      {error && <div className="mensaje-error">{error}</div>}
      {exito && <div className="mensaje-exito">{exito}</div>}

      <div className="tarjeta tabla-contenedor">
        {cargando && <p className="tabla-vacia">Cargando...</p>}

        {!cargando && residentes.length === 0 && (
          <p className="tabla-vacia">Aún no hay residentes registrados.</p>
        )}

        {!cargando && residentes.length > 0 && (
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Unidad</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {residentes.map((residente) => (
                <tr key={residente.id} className={residente.activo ? '' : 'fila-inactiva'}>
                  <td>{residente.nombre}</td>
                  <td>{residente.correo}</td>
                  <td>{residente.telefono || '—'}</td>
                  <td>
                    {nombreUnidad(residente.torre, residente.numero) || (
                      <span className="texto-suave">Sin unidad</span>
                    )}
                  </td>
                  <td>
                    {residente.activo ? (
                      <span className="insignia insignia-exito">Activo</span>
                    ) : (
                      <span className="insignia insignia-neutra">Dado de baja</span>
                    )}
                  </td>
                  <td className="tabla-acciones">
                    <button className="boton-enlace" onClick={() => abrirEditar(residente)}>
                      Editar
                    </button>
                    {residente.activo && (
                      <button className="boton-enlace" onClick={() => restablecerPassword(residente)}>
                        Restablecer contraseña
                      </button>
                    )}
                    <button
                      className={residente.activo ? 'boton-enlace peligro' : 'boton-enlace'}
                      onClick={() => cambiarEstado(residente)}
                    >
                      {residente.activo ? 'Dar de baja' : 'Reactivar'}
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
          titulo={editandoId ? 'Editar residente' : 'Nuevo residente'}
          onCerrar={() => setModalAbierto(false)}
        >
          <form onSubmit={guardar}>
            {errorForm && <div className="mensaje-error">{errorForm}</div>}

            <div className="campo">
              <label htmlFor="nombre">Nombre completo</label>
              <input id="nombre" name="nombre" value={form.nombre} onChange={actualizar} required />
            </div>

            <div className="campo">
              <label htmlFor="correo">Correo electrónico</label>
              <input
                id="correo"
                name="correo"
                type="email"
                value={form.correo}
                onChange={actualizar}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="telefono">Teléfono (opcional)</label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                value={form.telefono}
                onChange={actualizar}
              />
            </div>

            <div className="campo">
              <label htmlFor="unidadId">Unidad</label>
              <select id="unidadId" name="unidadId" value={form.unidadId} onChange={actualizar}>
                <option value="">Sin unidad asignada</option>
                {unidades.map((unidad) => (
                  <option key={unidad.id} value={unidad.id}>
                    {nombreUnidad(unidad.torre, unidad.numero)}
                  </option>
                ))}
              </select>
            </div>

            {!editandoId && (
              <div className="campo">
                <label htmlFor="passwordTemporal">Contraseña temporal</label>
                <input
                  id="passwordTemporal"
                  name="passwordTemporal"
                  type="text"
                  minLength={8}
                  value={form.passwordTemporal}
                  onChange={actualizar}
                  required
                />
                <p className="ayuda">
                  Mínimo 8 caracteres. El residente deberá cambiarla en su primer ingreso.
                </p>
              </div>
            )}

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
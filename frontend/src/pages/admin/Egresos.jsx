import { useEffect, useState } from 'react';
import { peticion } from '../../services/api';
import Modal from '../../components/Modal';
import { SelectorFecha, SelectorMes } from '../../components/SelectorFecha';
import { dinero, formatoFecha, hoy, mesActual } from '../../utils/formato';

const CATEGORIAS = {
  mantenimiento: 'Mantenimiento',
  servicios: 'Servicios',
  limpieza: 'Limpieza',
  seguridad: 'Seguridad',
  administracion: 'Administración',
  otro: 'Otro',
};

function formVacio() {
  return { concepto: '', categoria: 'mantenimiento', monto: '', fecha: hoy(), descripcion: '' };
}

export default function Egresos() {
  const [mes, setMes] = useState(mesActual());
  const [egresos, setEgresos] = useState([]);
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
    peticion(`/egresos?mes=${mes}`)
      .then((datos) => {
        if (activo) setEgresos(datos);
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
  }, [mes, recarga]);

  function recargar() {
    setRecarga((n) => n + 1);
  }

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
      await peticion('/egresos', {
        metodo: 'POST',
        datos: { ...form, monto: Number(form.monto) },
      });
      setExito('Egreso registrado correctamente');
      setModalAbierto(false);
      setMes(form.fecha.slice(0, 7));
      recargar();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(egreso) {
    if (!window.confirm(`¿Eliminar el egreso "${egreso.concepto}" por ${dinero(egreso.monto)}?`)) {
      return;
    }

    setError('');
    setExito('');
    try {
      await peticion(`/egresos/${egreso.id}`, { metodo: 'DELETE' });
      setExito('Egreso eliminado correctamente');
      recargar();
    } catch (err) {
      setError(err.message);
    }
  }

  const total = egresos.reduce((suma, egreso) => suma + Number(egreso.monto), 0);

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Egresos</h1>
          <p>Gastos del conjunto: mantenimiento, servicios, limpieza y más.</p>
        </div>
        <button className="boton" onClick={abrirNuevo}>
          + Nuevo egreso
        </button>
      </div>

      {error && <div className="mensaje-error">{error}</div>}
      {exito && <div className="mensaje-exito">{exito}</div>}

      <div className="filtros">
        <div className="campo">
          <label htmlFor="mes">Mes</label>
          <SelectorMes id="mes" value={mes} onChange={(e) => setMes(e.target.value)} />
        </div>
        <p className="texto-suave">
          {egresos.length} {egresos.length === 1 ? 'egreso' : 'egresos'} · {dinero(total)} en
          total
        </p>
      </div>

      <div className="tarjeta tabla-contenedor">
        {cargando && <p className="tabla-vacia">Cargando...</p>}

        {!cargando && egresos.length === 0 && (
          <p className="tabla-vacia">No hay egresos registrados en este mes.</p>
        )}

        {!cargando && egresos.length > 0 && (
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Categoría</th>
                <th>Monto</th>
                <th>Descripción</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {egresos.map((egreso) => (
                <tr key={egreso.id}>
                  <td>{formatoFecha(egreso.fecha)}</td>
                  <td>{egreso.concepto}</td>
                  <td>
                    <span className="insignia">{CATEGORIAS[egreso.categoria]}</span>
                  </td>
                  <td>{dinero(egreso.monto)}</td>
                  <td>{egreso.descripcion || <span className="texto-suave">—</span>}</td>
                  <td className="tabla-acciones">
                    <button className="boton-enlace peligro" onClick={() => eliminar(egreso)}>
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
        <Modal titulo="Nuevo egreso" onCerrar={cerrarModal}>
          <form onSubmit={guardar}>
            {errorForm && <div className="mensaje-error">{errorForm}</div>}

            <div className="campo">
              <label htmlFor="concepto">Concepto</label>
              <input
                id="concepto"
                name="concepto"
                value={form.concepto}
                onChange={actualizar}
                placeholder="Ej. Recibo de luz de áreas comunes"
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="categoria">Categoría</label>
              <select id="categoria" name="categoria" value={form.categoria} onChange={actualizar}>
                {Object.entries(CATEGORIAS).map(([valor, texto]) => (
                  <option key={valor} value={valor}>
                    {texto}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="monto">Monto</label>
              <input
                id="monto"
                name="monto"
                type="number"
                min="0.01"
                step="0.01"
                value={form.monto}
                onChange={actualizar}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="fecha">Fecha</label>
                <SelectorFecha
                id="fecha"
                name="fecha"
                max={hoy()}
                value={form.fecha}
                onChange={actualizar}
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
                placeholder="Proveedor, número de factura u otros detalles"
              />
            </div>

            <div className="modal-acciones">
              <button type="button" className="boton-secundario" onClick={cerrarModal}>
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
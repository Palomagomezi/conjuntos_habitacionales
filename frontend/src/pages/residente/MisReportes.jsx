import { useEffect, useState } from 'react';
import { peticion } from '../../services/api';
import Modal from '../../components/Modal';
import DetalleReporte from '../../components/DetalleReporte';
import { CATEGORIAS_REPORTE, ESTADOS_REPORTE } from '../../utils/mantenimiento';
import { formatoFecha, formatoFechaHora } from '../../utils/formato';

function formVacio() {
  return { titulo: '', categoria: 'plomeria', ubicacion: '', descripcion: '' };
}

export default function MisReportes() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [recarga, setRecarga] = useState(0);

  const [modalNuevo, setModalNuevo] = useState(false);
  const [form, setForm] = useState(formVacio());
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [detalle, setDetalle] = useState(null);

  useEffect(() => {
    let activo = true;
    peticion('/reportes')
      .then((datos) => {
        if (activo) setReportes(datos);
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
    setModalNuevo(true);
  }

  function cerrarModales() {
    setModalNuevo(false);
    setDetalle(null);
    setErrorForm('');
  }

  function actualizar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function enviar(e) {
    e.preventDefault();
    setErrorForm('');
    setExito('');
    setGuardando(true);

    try {
      const respuesta = await peticion('/reportes', { metodo: 'POST', datos: form });
      setExito(`Reporte #${respuesta.id} enviado. La administración le dará seguimiento.`);
      setModalNuevo(false);
      setRecarga((n) => n + 1);
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function verDetalle(id) {
    setError('');
    try {
      setDetalle(await peticion(`/reportes/${id}`));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Mantenimiento</h1>
          <p>Reporta fallas en tu unidad o en áreas comunes y revisa su avance.</p>
        </div>
        <button className="boton" onClick={abrirNuevo}>
          + Nuevo reporte
        </button>
      </div>

      {error && <div className="mensaje-error">{error}</div>}
      {exito && <div className="mensaje-exito">{exito}</div>}

      <div className="tarjeta tabla-contenedor">
        {cargando && <p className="tabla-vacia">Cargando...</p>}

        {!cargando && reportes.length === 0 && (
          <p className="tabla-vacia">Aún no has levantado reportes.</p>
        )}

        {!cargando && reportes.length > 0 && (
          <table className="tabla">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Reporte</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Última actualización</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reportes.map((reporte) => (
                <tr key={reporte.id}>
                  <td>#{reporte.id}</td>
                  <td>{formatoFecha(reporte.creado_en)}</td>
                  <td>
                    {reporte.titulo}
                    <p className="ayuda">{reporte.ubicacion}</p>
                  </td>
                  <td>{CATEGORIAS_REPORTE[reporte.categoria]}</td>
                  <td>
                    <span className={`insignia ${ESTADOS_REPORTE[reporte.estado].clase}`}>
                      {ESTADOS_REPORTE[reporte.estado].texto}
                    </span>
                  </td>
                  <td>{formatoFechaHora(reporte.actualizado_en)}</td>
                  <td className="tabla-acciones">
                    <button className="boton-enlace" onClick={() => verDetalle(reporte.id)}>
                      Ver seguimiento
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalNuevo && (
        <Modal titulo="Nuevo reporte" onCerrar={cerrarModales}>
          <form onSubmit={enviar}>
            {errorForm && <div className="mensaje-error">{errorForm}</div>}

            <div className="campo">
              <label htmlFor="titulo">¿Qué sucede?</label>
              <input
                id="titulo"
                name="titulo"
                value={form.titulo}
                onChange={actualizar}
                placeholder="Ej. Lámpara fundida en el pasillo"
                maxLength={150}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="categoria">Categoría</label>
              <select id="categoria" name="categoria" value={form.categoria} onChange={actualizar}>
                {Object.entries(CATEGORIAS_REPORTE).map(([valor, texto]) => (
                  <option key={valor} value={valor}>
                    {texto}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="ubicacion">Ubicación</label>
              <input
                id="ubicacion"
                name="ubicacion"
                value={form.ubicacion}
                onChange={actualizar}
                placeholder="Ej. Mi unidad, alberca, estacionamiento"
                maxLength={150}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="descripcion">Descripción</label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={4}
                value={form.descripcion}
                onChange={actualizar}
                placeholder="Describe el problema con el mayor detalle posible"
                required
              />
            </div>

            <div className="modal-acciones">
              <button type="button" className="boton-secundario" onClick={cerrarModales}>
                Cancelar
              </button>
              <button type="submit" className="boton" disabled={guardando}>
                {guardando ? 'Enviando...' : 'Enviar reporte'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {detalle && (
        <Modal titulo={`Reporte #${detalle.id}`} onCerrar={cerrarModales} amplio>
          <DetalleReporte reporte={detalle} />
        </Modal>
      )}
    </>
  );
}
import { useEffect, useState } from 'react';
import { peticion } from '../../services/api';
import Modal from '../../components/Modal';
import DetalleReporte from '../../components/DetalleReporte';
import {
  CATEGORIAS_REPORTE,
  ESTADOS_REPORTE,
  PRIORIDADES_REPORTE,
  reporteCerrado,
} from '../../utils/mantenimiento';
import { formatoFecha, nombreUnidad } from '../../utils/formato';

export default function Mantenimiento() {
  const [filtro, setFiltro] = useState('');
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [recarga, setRecarga] = useState(0);

  const [detalle, setDetalle] = useState(null);
  const [form, setForm] = useState({ estado: 'en_proceso', prioridad: 'media', comentario: '' });
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;
    peticion(`/reportes${filtro ? `?estado=${filtro}` : ''}`)
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
  }, [filtro, recarga]);

  async function abrirDetalle(id) {
    setError('');
    setErrorForm('');
    try {
      const datos = await peticion(`/reportes/${id}`);
      setDetalle(datos);
      setForm({
        estado: datos.estado === 'recibido' ? 'en_proceso' : datos.estado,
        prioridad: datos.prioridad,
        comentario: '',
      });
    } catch (err) {
      setError(err.message);
    }
  }

  function cerrarDetalle() {
    setDetalle(null);
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
      await peticion(`/reportes/${detalle.id}/estado`, { metodo: 'PUT', datos: form });
      setExito(`Reporte #${detalle.id} actualizado`);
      setDetalle(null);
      setRecarga((n) => n + 1);
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  const abiertos = reportes.filter((reporte) => !reporteCerrado(reporte.estado)).length;

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Mantenimiento</h1>
          <p>Reportes de los residentes sobre sus unidades y áreas comunes.</p>
        </div>
      </div>

      {error && <div className="mensaje-error">{error}</div>}
      {exito && <div className="mensaje-exito">{exito}</div>}

      <div className="filtros">
        <div className="campo">
          <label htmlFor="filtro">Estado</label>
          <select id="filtro" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(ESTADOS_REPORTE).map(([valor, { texto }]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </div>
        <p className="texto-suave">
          {reportes.length} {reportes.length === 1 ? 'reporte' : 'reportes'}
          {!filtro && ` · ${abiertos} por atender`}
        </p>
      </div>

      <div className="tarjeta tabla-contenedor">
        {cargando && <p className="tabla-vacia">Cargando...</p>}

        {!cargando && reportes.length === 0 && (
          <p className="tabla-vacia">No hay reportes con este filtro.</p>
        )}

        {!cargando && reportes.length > 0 && (
          <table className="tabla">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Reporte</th>
                <th>Reportó</th>
                <th>Categoría</th>
                <th>Prioridad</th>
                <th>Estado</th>
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
                  <td>
                    {reporte.reportado_por || '—'}
                    <p className="ayuda">{nombreUnidad(reporte.torre, reporte.numero)}</p>
                  </td>
                  <td>{CATEGORIAS_REPORTE[reporte.categoria]}</td>
                  <td>
                    <span className={`insignia ${PRIORIDADES_REPORTE[reporte.prioridad].clase}`}>
                      {PRIORIDADES_REPORTE[reporte.prioridad].texto}
                    </span>
                  </td>
                  <td>
                    <span className={`insignia ${ESTADOS_REPORTE[reporte.estado].clase}`}>
                      {ESTADOS_REPORTE[reporte.estado].texto}
                    </span>
                  </td>
                  <td className="tabla-acciones">
                    <button className="boton-enlace" onClick={() => abrirDetalle(reporte.id)}>
                      {reporteCerrado(reporte.estado) ? 'Ver' : 'Atender'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detalle && (
        <Modal titulo={`Reporte #${detalle.id}`} onCerrar={cerrarDetalle} amplio>
          <DetalleReporte reporte={detalle} />

          {reporteCerrado(detalle.estado) ? (
            <p className="ayuda">Este reporte está cerrado y ya no se puede modificar.</p>
          ) : (
            <form onSubmit={guardar} className="formulario-seguimiento">
              {errorForm && <div className="mensaje-error">{errorForm}</div>}

              <div className="campo">
                <label htmlFor="estado">Nuevo estado</label>
                <select id="estado" name="estado" value={form.estado} onChange={actualizar}>
                  <option value="en_proceso">En proceso</option>
                  <option value="resuelto">Resuelto</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>

              <div className="campo">
                <label htmlFor="prioridad">Prioridad</label>
                <select id="prioridad" name="prioridad" value={form.prioridad} onChange={actualizar}>
                  {Object.entries(PRIORIDADES_REPORTE).map(([valor, { texto }]) => (
                    <option key={valor} value={valor}>
                      {texto}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo">
                <label htmlFor="comentario">
                  Comentario {form.estado === 'rechazado' ? '(motivo del rechazo)' : '(opcional)'}
                </label>
                <textarea
                  id="comentario"
                  name="comentario"
                  value={form.comentario}
                  onChange={actualizar}
                  placeholder="Ej. Se programó la visita del plomero para el lunes"
                  required={form.estado === 'rechazado'}
                />
              </div>

              <div className="modal-acciones">
                <button type="button" className="boton-secundario" onClick={cerrarDetalle}>
                  Cancelar
                </button>
                <button type="submit" className="boton" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar seguimiento'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
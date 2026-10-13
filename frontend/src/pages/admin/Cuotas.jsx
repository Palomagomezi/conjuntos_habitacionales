import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { peticion } from '../../services/api';
import Modal from '../../components/Modal';
import {
  dinero,
  formatoFecha,
  formatoPeriodo,
  hoy,
  mesActual,
  nombreUnidad,
} from '../../utils/formato';

function formGenerarVacio(periodo) {
  return { concepto: 'Mantenimiento', periodo, monto: '', fechaLimite: `${periodo}-10` };
}

function formPagoVacio() {
  return { metodo: 'transferencia', referencia: '', fechaPago: hoy() };
}

export default function Cuotas() {
  const [periodo, setPeriodo] = useState(mesActual());
  const [cuotas, setCuotas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [recarga, setRecarga] = useState(0);

  const [modal, setModal] = useState(null);
  const [formGenerar, setFormGenerar] = useState(formGenerarVacio(mesActual()));
  const [cuotaPago, setCuotaPago] = useState(null);
  const [formPago, setFormPago] = useState(formPagoVacio());
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;
    peticion(`/cuotas?periodo=${periodo}`)
      .then((datos) => {
        if (activo) setCuotas(datos);
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
  }, [periodo, recarga]);

  function recargar() {
    setRecarga((n) => n + 1);
  }

  function cerrarModal() {
    setModal(null);
    setErrorForm('');
  }

  function abrirGenerar() {
    setFormGenerar(formGenerarVacio(periodo || mesActual()));
    setErrorForm('');
    setModal('generar');
  }

  function abrirPago(cuota) {
    setCuotaPago(cuota);
    setFormPago(formPagoVacio());
    setErrorForm('');
    setModal('pago');
  }

  function actualizarGenerar(e) {
    setFormGenerar({ ...formGenerar, [e.target.name]: e.target.value });
  }

  function actualizarPago(e) {
    setFormPago({ ...formPago, [e.target.name]: e.target.value });
  }

  async function generar(e) {
    e.preventDefault();
    setErrorForm('');
    setExito('');
    setGuardando(true);

    try {
      const respuesta = await peticion('/cuotas/generar', {
        metodo: 'POST',
        datos: { ...formGenerar, monto: Number(formGenerar.monto) },
      });
      setExito(
        respuesta.generadas > 0
          ? `${respuesta.mensaje} para ${formatoPeriodo(formGenerar.periodo)}.`
          : 'Todas las unidades ya tenían esa cuota; no se generó ninguna nueva.'
      );
      setModal(null);
      setPeriodo(formGenerar.periodo);
      recargar();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function registrarPago(e) {
    e.preventDefault();
    setErrorForm('');
    setExito('');
    setGuardando(true);

    try {
      const pago = await peticion('/pagos', {
        metodo: 'POST',
        datos: { cuotaId: cuotaPago.id, ...formPago },
      });
      setExito(`Pago registrado. Se generó el comprobante ${pago.folio}.`);
      setModal(null);
      recargar();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(cuota) {
    const unidad = nombreUnidad(cuota.torre, cuota.numero);
    if (!window.confirm(`¿Eliminar la cuota "${cuota.concepto}" de la unidad ${unidad}?`)) return;

    setError('');
    setExito('');
    try {
      await peticion(`/cuotas/${cuota.id}`, { metodo: 'DELETE' });
      setExito('Cuota eliminada correctamente');
      recargar();
    } catch (err) {
      setError(err.message);
    }
  }

  const fechaHoy = hoy();
  const pendientes = cuotas.filter((cuota) => cuota.estado === 'pendiente');
  const porCobrar = pendientes.reduce((suma, cuota) => suma + Number(cuota.monto), 0);

  function insigniaEstado(cuota) {
    if (cuota.estado === 'pagada') {
      return <span className="insignia insignia-exito">Pagada</span>;
    }
    if (cuota.fecha_limite < fechaHoy) {
      return <span className="insignia insignia-peligro">Vencida</span>;
    }
    return <span className="insignia insignia-alerta">Pendiente</span>;
  }

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Cuotas</h1>
          <p>Cuotas de mantenimiento por unidad y registro de pagos.</p>
        </div>
        <button className="boton" onClick={abrirGenerar}>
          + Generar cuotas
        </button>
      </div>

      {error && <div className="mensaje-error">{error}</div>}
      {exito && <div className="mensaje-exito">{exito}</div>}

      <div className="filtros">
        <div className="campo">
          <label htmlFor="periodo">Mes</label>
          <input
            id="periodo"
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          />
        </div>
        <p className="texto-suave">
          {pendientes.length} {pendientes.length === 1 ? 'pendiente' : 'pendientes'} ·{' '}
          {dinero(porCobrar)} por cobrar
        </p>
      </div>

      <div className="tarjeta tabla-contenedor">
        {cargando && <p className="tabla-vacia">Cargando...</p>}

        {!cargando && cuotas.length === 0 && (
          <p className="tabla-vacia">No hay cuotas para este mes.</p>
        )}

        {!cargando && cuotas.length > 0 && (
          <table className="tabla">
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Residentes</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Fecha límite</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cuotas.map((cuota) => (
                <tr key={cuota.id}>
                  <td>{nombreUnidad(cuota.torre, cuota.numero)}</td>
                  <td>
                    {cuota.residentes || <span className="texto-suave">Sin residentes</span>}
                  </td>
                  <td>
                    {cuota.concepto} {formatoPeriodo(cuota.periodo)}
                  </td>
                  <td>{dinero(cuota.monto)}</td>
                  <td>{formatoFecha(cuota.fecha_limite)}</td>
                  <td>{insigniaEstado(cuota)}</td>
                  <td className="tabla-acciones">
                    {cuota.estado === 'pendiente' && (
                      <>
                        <button className="boton-enlace" onClick={() => abrirPago(cuota)}>
                          Registrar pago
                        </button>
                        <button className="boton-enlace peligro" onClick={() => eliminar(cuota)}>
                          Eliminar
                        </button>
                      </>
                    )}
                    {cuota.estado === 'pagada' && cuota.pago_id && (
                      <Link className="boton-enlace" to={`/admin/comprobante/${cuota.pago_id}`}>
                        Ver comprobante
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal === 'generar' && (
        <Modal titulo="Generar cuotas" onCerrar={cerrarModal}>
          <form onSubmit={generar}>
            {errorForm && <div className="mensaje-error">{errorForm}</div>}

            <p className="ayuda">
              Se creará una cuota para cada unidad del conjunto. Las unidades que ya la tengan
              no se duplican.
            </p>

            <div className="campo">
              <label htmlFor="concepto">Concepto</label>
              <input
                id="concepto"
                name="concepto"
                value={formGenerar.concepto}
                onChange={actualizarGenerar}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="periodoCuota">Mes</label>
              <input
                id="periodoCuota"
                name="periodo"
                type="month"
                value={formGenerar.periodo}
                onChange={actualizarGenerar}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="monto">Monto por unidad</label>
              <input
                id="monto"
                name="monto"
                type="number"
                min="1"
                step="0.01"
                value={formGenerar.monto}
                onChange={actualizarGenerar}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="fechaLimite">Fecha límite de pago</label>
              <input
                id="fechaLimite"
                name="fechaLimite"
                type="date"
                value={formGenerar.fechaLimite}
                onChange={actualizarGenerar}
                required
              />
            </div>

            <div className="modal-acciones">
              <button type="button" className="boton-secundario" onClick={cerrarModal}>
                Cancelar
              </button>
              <button type="submit" className="boton" disabled={guardando}>
                {guardando ? 'Generando...' : 'Generar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'pago' && cuotaPago && (
        <Modal titulo="Registrar pago" onCerrar={cerrarModal}>
          <form onSubmit={registrarPago}>
            {errorForm && <div className="mensaje-error">{errorForm}</div>}

            <div className="resumen-pago">
              <strong>Unidad {nombreUnidad(cuotaPago.torre, cuotaPago.numero)}</strong>
              {cuotaPago.residentes && ` · ${cuotaPago.residentes}`}
              <br />
              {cuotaPago.concepto} {formatoPeriodo(cuotaPago.periodo)} ·{' '}
              <strong>{dinero(cuotaPago.monto)}</strong>
            </div>

            <div className="campo">
              <label htmlFor="metodo">Método de pago</label>
              <select id="metodo" name="metodo" value={formPago.metodo} onChange={actualizarPago}>
                <option value="transferencia">Transferencia</option>
                <option value="deposito">Depósito</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </div>

            <div className="campo">
              <label htmlFor="referencia">Referencia (opcional)</label>
              <input
                id="referencia"
                name="referencia"
                value={formPago.referencia}
                onChange={actualizarPago}
                placeholder="Número de operación o folio del banco"
              />
            </div>

            <div className="campo">
              <label htmlFor="fechaPago">Fecha del pago</label>
              <input
                id="fechaPago"
                name="fechaPago"
                type="date"
                max={fechaHoy}
                value={formPago.fechaPago}
                onChange={actualizarPago}
                required
              />
            </div>

            <div className="modal-acciones">
              <button type="button" className="boton-secundario" onClick={cerrarModal}>
                Cancelar
              </button>
              <button type="submit" className="boton" disabled={guardando}>
                {guardando ? 'Registrando...' : 'Registrar pago'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
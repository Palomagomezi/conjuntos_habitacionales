const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function dinero(valor) {
  return Number(valor).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function formatoFecha(texto) {
  if (!texto) return '—';
  const [anio, mes, dia] = texto.slice(0, 10).split('-');
  return `${Number(dia)} ${MESES[Number(mes) - 1]} ${anio}`;
}

export function formatoPeriodo(periodo) {
  if (!periodo) return '';
  const [anio, mes] = periodo.split('-');
  return `${MESES_LARGOS[Number(mes) - 1]} ${anio}`;
}

export function hoy() {
  const fecha = new Date();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function mesActual() {
  return hoy().slice(0, 7);
}

export function nombreUnidad(torre, numero) {
  if (!numero) return '';
  return torre ? `${torre}-${numero}` : numero;
}

export function formatoFechaHora(texto) {
  if (!texto) return '—';
  return `${formatoFecha(texto)}, ${texto.slice(11, 16)} h`;
}
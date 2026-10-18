export const ESTADOS_REPORTE = {
  recibido: { texto: 'Recibido', clase: 'insignia-neutra' },
  en_proceso: { texto: 'En proceso', clase: 'insignia-alerta' },
  resuelto: { texto: 'Resuelto', clase: 'insignia-exito' },
  rechazado: { texto: 'Rechazado', clase: 'insignia-peligro' },
};

export const CATEGORIAS_REPORTE = {
  plomeria: 'Plomería',
  electricidad: 'Electricidad',
  jardineria: 'Jardinería',
  limpieza: 'Limpieza',
  seguridad: 'Seguridad',
  estructura: 'Estructura',
  otro: 'Otro',
};

export const PRIORIDADES_REPORTE = {
  baja: { texto: 'Baja', clase: 'insignia-neutra' },
  media: { texto: 'Media', clase: '' },
  alta: { texto: 'Alta', clase: 'insignia-peligro' },
};

export function reporteCerrado(estado) {
  return estado === 'resuelto' || estado === 'rechazado';
}
import { useEffect, useRef, useState } from 'react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const VACIO = { dia: '', mes: '', anio: '', hora: '', minuto: '' };

function dosDigitos(numero) {
  return String(numero).padStart(2, '0');
}

function lista(desde, hasta, paso = 1) {
  const valores = [];
  for (let n = desde; n <= hasta; n += paso) valores.push(dosDigitos(n));
  return valores;
}

function diasDelMes(anio, mes) {
  if (!mes) return 31;
  return new Date(Number(anio) || 2000, Number(mes), 0).getDate();
}

function separar(valor) {
  return {
    anio: valor.slice(0, 4),
    mes: valor.slice(5, 7),
    dia: valor.slice(8, 10),
    hora: valor.slice(11, 13),
    minuto: valor.slice(14, 16),
  };
}

function SelectorBase({ id, name, value, onChange, min, max, required, conDia, conHora }) {
  const [borrador, setBorrador] = useState(VACIO);
  const primerCampo = useRef(null);
  const partes = value ? separar(value) : borrador;

  const anioActual = new Date().getFullYear();
  const anioDesde = min ? Number(min.slice(0, 4)) : anioActual - 5;
  const anioHasta = max ? Number(max.slice(0, 4)) : anioActual + 2;
  const anios = [];
  for (let a = anioDesde; a <= anioHasta; a++) anios.push(String(a));

  const necesarios = ['anio', 'mes'];
  if (conDia) necesarios.push('dia');
  if (conHora) necesarios.push('hora', 'minuto');

  //Si la fecha queda fuera del rango permitido, el navegador no deja enviar el formulario
  useEffect(() => {
    if (!primerCampo.current) return;
    let mensaje = '';
    if (value && min && value < min) mensaje = 'Elige una fecha posterior a la actual';
    if (value && max && value > max) mensaje = 'La fecha no puede ser posterior a hoy';
    primerCampo.current.setCustomValidity(mensaje);
  }, [value, min, max]);

  function cambiar(campo, nuevoValor) {
    const nuevas = { ...partes, [campo]: nuevoValor };

    const maximo = diasDelMes(nuevas.anio, nuevas.mes);
    if (nuevas.dia && Number(nuevas.dia) > maximo) nuevas.dia = dosDigitos(maximo);

    const completo = necesarios.every((parte) => nuevas[parte]);
    let resultado = '';

    if (completo) {
      resultado = `${nuevas.anio}-${nuevas.mes}`;
      if (conDia) resultado += `-${nuevas.dia}`;
      if (conHora) resultado += `T${nuevas.hora}:${nuevas.minuto}`;
      setBorrador(VACIO);
    } else {
      setBorrador(nuevas);
    }

    onChange({ target: { name, value: resultado } });
  }

  const dias = lista(1, diasDelMes(partes.anio, partes.mes));

  return (
    <div className="selector-fecha">
      {conDia && (
        <select
          id={id}
          ref={primerCampo}
          aria-label="Día"
          value={partes.dia}
          onChange={(e) => cambiar('dia', e.target.value)}
          required={required}
        >
          {!partes.dia && <option value="">Día</option>}
          {dias.map((d) => (
            <option key={d} value={d}>
              {Number(d)}
            </option>
          ))}
        </select>
      )}

      <select
        id={conDia ? undefined : id}
        ref={conDia ? undefined : primerCampo}
        aria-label="Mes"
        value={partes.mes}
        onChange={(e) => cambiar('mes', e.target.value)}
        required={required}
      >
        {!partes.mes && <option value="">Mes</option>}
        {MESES.map((nombre, i) => (
          <option key={nombre} value={dosDigitos(i + 1)}>
            {nombre}
          </option>
        ))}
      </select>

      <select
        aria-label="Año"
        value={partes.anio}
        onChange={(e) => cambiar('anio', e.target.value)}
        required={required}
      >
        {!partes.anio && <option value="">Año</option>}
        {anios.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      {conHora && (
        <div className="selector-hora">
          <select
            aria-label="Hora"
            value={partes.hora}
            onChange={(e) => cambiar('hora', e.target.value)}
            required={required}
          >
            {!partes.hora && <option value="">Hora</option>}
            {lista(0, 23).map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <span>:</span>
          <select
            aria-label="Minutos"
            value={partes.minuto}
            onChange={(e) => cambiar('minuto', e.target.value)}
            required={required}
          >
            {!partes.minuto && <option value="">Min</option>}
            {lista(0, 55, 5).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <span>h</span>
        </div>
      )}
    </div>
  );
}

export function SelectorFecha(props) {
  return <SelectorBase {...props} conDia />;
}

export function SelectorMes(props) {
  return <SelectorBase {...props} />;
}

export function SelectorFechaHora(props) {
  return <SelectorBase {...props} conDia conHora />;
}
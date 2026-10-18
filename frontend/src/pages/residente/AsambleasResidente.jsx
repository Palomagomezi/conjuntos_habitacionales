import { useEffect, useState } from 'react';
import { peticion } from '../../services/api';
import TarjetaAsamblea from '../../components/TarjetaAsamblea';

export default function AsambleasResidente() {
  const [asambleas, setAsambleas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    peticion('/asambleas')
      .then((datos) => {
        if (activo) setAsambleas(datos);
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
  }, []);

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Asambleas</h1>
          <p>Convocatorias y acuerdos del conjunto.</p>
        </div>
      </div>

      {error && <div className="mensaje-error">{error}</div>}

      {cargando && <p className="texto-suave">Cargando...</p>}

      {!cargando && asambleas.length === 0 && (
        <div className="tarjeta">
          <p className="tabla-vacia">No hay asambleas registradas.</p>
        </div>
      )}

      <div className="avisos-lista">
        {asambleas.map((asamblea) => (
          <TarjetaAsamblea key={asamblea.id} asamblea={asamblea} />
        ))}
      </div>
    </>
  );
}
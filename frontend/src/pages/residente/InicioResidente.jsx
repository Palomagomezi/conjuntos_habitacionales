import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export default function InicioResidente() {
  const { usuario } = useAuth();

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Hola, {usuario.nombre}</h1>
          <p>Aquí podrás consultar tus pagos, los avisos del conjunto y tus reportes.</p>
        </div>
      </div>

      <div className="tarjetas-inicio">
        <Link to="/residente/estado-cuenta" className="tarjeta tarjeta-acceso">
          <h3>Estado de cuenta</h3>
          <p>Consulta tus cuotas, pagos y comprobantes.</p>
        </Link>
        <Link to="/residente/avisos" className="tarjeta tarjeta-acceso">
          <h3>Avisos</h3>
          <p>Lee los comunicados de la administración.</p>
        </Link>
        <Link to="/residente/asambleas" className="tarjeta tarjeta-acceso">
          <h3>Asambleas</h3>
          <p>Revisa las convocatorias y los acuerdos.</p>
        </Link>
        <Link to="/residente/votaciones" className="tarjeta tarjeta-acceso">
          <h3>Votaciones</h3>
          <p>Emite el voto de tu unidad.</p>
        </Link>
        <Link to="/residente/reportes" className="tarjeta tarjeta-acceso">
          <h3>Mantenimiento</h3>
          <p>Reporta fallas y revisa su avance.</p>
        </Link>
      </div>
    </>
  );
}
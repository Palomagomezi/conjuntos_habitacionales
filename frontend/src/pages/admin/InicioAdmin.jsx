import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export default function InicioAdmin() {
  const { usuario } = useAuth();

  return (
    <>
      <div className="encabezado">
        <div>
          <h1>Hola, {usuario.nombre}</h1>
          <p>Este es el panel de administración de tu conjunto.</p>
        </div>
      </div>

      <div className="tarjetas-inicio">
        <Link to="/admin/unidades" className="tarjeta tarjeta-acceso">
          <h3>Unidades</h3>
          <p>Registra las casas o departamentos del conjunto.</p>
        </Link>
        <Link to="/admin/residentes" className="tarjeta tarjeta-acceso">
          <h3>Residentes</h3>
          <p>Crea las cuentas de los residentes y asígnalos a su unidad.</p>
        </Link>
      </div>
    </>
  );
}
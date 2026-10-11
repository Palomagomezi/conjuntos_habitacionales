import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function RutaProtegida({ rol, children }) {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  if (usuario.debeCambiarPassword) {
    return <Navigate to="/cambiar-password" replace />;
  }
  if (rol && usuario.rol !== rol) {
    const destino = usuario.rol === 'administrador' ? '/admin' : '/residente';
    return <Navigate to={destino} replace />;
  }
  return children;
}
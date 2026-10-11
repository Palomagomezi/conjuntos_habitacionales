import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import RutaProtegida from './components/RutaProtegida';
import Login from './pages/Login';
import Registro from './pages/Registro';
import CambiarPassword from './pages/CambiarPassword';

function Temporal({ texto }) {
  const { usuario, cerrarSesion } = useAuth();
  return (
    <div style={{ padding: '2rem' }}>
      <div className="tarjeta">
        <h2>{texto}</h2>
        <p>Hola, {usuario?.nombre}</p>
        <button className="boton-secundario" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/cambiar-password" element={<CambiarPassword />} />
          <Route
            path="/admin"
            element={
              <RutaProtegida rol="administrador">
                <Temporal texto="Panel del administrador" />
              </RutaProtegida>
            }
          />
          <Route
            path="/residente"
            element={
              <RutaProtegida rol="residente">
                <Temporal texto="Panel del residente" />
              </RutaProtegida>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
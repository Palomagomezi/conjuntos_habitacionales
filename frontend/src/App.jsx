import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';
import PanelLayout from './layouts/PanelLayout';
import Login from './pages/Login';
import Registro from './pages/Registro';
import CambiarPassword from './pages/CambiarPassword';
import InicioAdmin from './pages/admin/InicioAdmin';
import InicioResidente from './pages/residente/InicioResidente';

function Temporal({ texto }) {
  return (
    <div className="tarjeta">
      <h2>{texto}</h2>
      <p>Pantalla en construcción.</p>
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
                <PanelLayout />
              </RutaProtegida>
            }
          >
            <Route index element={<InicioAdmin />} />
            <Route path="unidades" element={<Temporal texto="Unidades" />} />
            <Route path="residentes" element={<Temporal texto="Residentes" />} />
          </Route>

          <Route
            path="/residente"
            element={
              <RutaProtegida rol="residente">
                <PanelLayout />
              </RutaProtegida>
            }
          >
            <Route index element={<InicioResidente />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
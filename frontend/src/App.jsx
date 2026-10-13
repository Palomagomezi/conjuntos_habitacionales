import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';
import PanelLayout from './layouts/PanelLayout';
import Login from './pages/Login';
import Registro from './pages/Registro';
import CambiarPassword from './pages/CambiarPassword';
import InicioAdmin from './pages/admin/InicioAdmin';
import Unidades from './pages/admin/Unidades';
import Residentes from './pages/admin/Residentes';
import Cuotas from './pages/admin/Cuotas';
import Egresos from './pages/admin/Egresos';
import Comprobante from './pages/Comprobante';
import InicioResidente from './pages/residente/InicioResidente';

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
            <Route path="unidades" element={<Unidades />} />
            <Route path="residentes" element={<Residentes />} />
            <Route path="cuotas" element={<Cuotas />} />
            <Route path="egresos" element={<Egresos />} />
            <Route path="comprobante/:id" element={<Comprobante />} />
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
            <Route path="comprobante/:id" element={<Comprobante />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
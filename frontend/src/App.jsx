import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';

function Temporal({ texto }) {
  return (
    <div style={{ padding: '2rem' }}>
      <div className="tarjeta">
        <h2>{texto}</h2>
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
          <Route path="/registro" element={<Temporal texto="Registro (siguiente paso)" />} />
          <Route path="/cambiar-password" element={<Temporal texto="Cambiar contraseña (siguiente paso)" />} />
          <Route path="/admin" element={<Temporal texto="Panel del administrador" />} />
          <Route path="/residente" element={<Temporal texto="Panel del residente" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
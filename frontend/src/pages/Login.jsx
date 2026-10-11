import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { useAuth } from '../context/useAuth';

export default function Login() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function manejarEnvio(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const usuario = await iniciarSesion(correo, password);
      if (usuario.debeCambiarPassword) {
        navigate('/cambiar-password');
      } else {
        navigate(usuario.rol === 'administrador' ? '/admin' : '/residente');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <AuthLayout titulo="Iniciar sesión" subtitulo="Ingresa con tu correo y contraseña">
      <form onSubmit={manejarEnvio}>
        {error && <div className="mensaje-error">{error}</div>}

        <div className="campo">
          <label htmlFor="correo">Correo electrónico</label>
          <input
            id="correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="boton auth-boton-completo" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <p className="auth-pie">
        ¿Administras un conjunto? <Link to="/registro">Registra tu conjunto</Link>
      </p>
    </AuthLayout>
  );
}
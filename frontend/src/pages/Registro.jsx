import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { useAuth } from '../context/useAuth';

export default function Registro() {
  const { registrar } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombreConjunto: '',
    nombre: '',
    correo: '',
    password: '',
    confirmar: '',
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  function actualizar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setCargando(true);
    try {
      await registrar({
        nombreConjunto: form.nombreConjunto,
        nombre: form.nombre,
        correo: form.correo,
        password: form.password,
      });
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <AuthLayout
      titulo="Registra tu conjunto"
      subtitulo="Crea la cuenta del administrador y el conjunto habitacional"
    >
      <form onSubmit={manejarEnvio}>
        {error && <div className="mensaje-error">{error}</div>}

        <div className="campo">
          <label htmlFor="nombreConjunto">Nombre del conjunto</label>
          <input
            id="nombreConjunto"
            name="nombreConjunto"
            value={form.nombreConjunto}
            onChange={actualizar}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="nombre">Tu nombre completo</label>
          <input id="nombre" name="nombre" value={form.nombre} onChange={actualizar} required />
        </div>

        <div className="campo">
          <label htmlFor="correo">Correo electrónico</label>
          <input
            id="correo"
            name="correo"
            type="email"
            value={form.correo}
            onChange={actualizar}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="password">Contraseña (mínimo 8 caracteres)</label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={8}
            value={form.password}
            onChange={actualizar}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="confirmar">Confirmar contraseña</label>
          <input
            id="confirmar"
            name="confirmar"
            type="password"
            minLength={8}
            value={form.confirmar}
            onChange={actualizar}
            required
          />
        </div>

        <button type="submit" className="boton auth-boton-completo" disabled={cargando}>
          {cargando ? 'Registrando...' : 'Registrar conjunto'}
        </button>
      </form>

      <p className="auth-pie">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </AuthLayout>
  );
}
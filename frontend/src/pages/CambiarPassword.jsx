import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { useAuth } from '../context/useAuth';

export default function CambiarPassword() {
  const { usuario, cambiarPassword } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ actual: '', nueva: '', confirmar: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  function actualizar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    setError('');

    if (form.nueva !== form.confirmar) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    setCargando(true);
    try {
      await cambiarPassword(form.actual, form.nueva);
      navigate(usuario.rol === 'administrador' ? '/admin' : '/residente');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <AuthLayout
      titulo="Cambia tu contraseña"
      subtitulo={
        usuario.debeCambiarPassword
          ? 'Por seguridad, cambia la contraseña que te dio tu administrador'
          : 'Escribe tu contraseña actual y la nueva'
      }
    >
      <form onSubmit={manejarEnvio}>
        {error && <div className="mensaje-error">{error}</div>}

        <div className="campo">
          <label htmlFor="actual">Contraseña actual</label>
          <input
            id="actual"
            name="actual"
            type="password"
            value={form.actual}
            onChange={actualizar}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="nueva">Nueva contraseña (mínimo 8 caracteres)</label>
          <input
            id="nueva"
            name="nueva"
            type="password"
            minLength={8}
            value={form.nueva}
            onChange={actualizar}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="confirmar">Confirmar nueva contraseña</label>
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
          {cargando ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>
    </AuthLayout>
  );
}
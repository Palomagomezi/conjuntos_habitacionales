import { useState } from 'react';
import { AuthContext } from './contexto';
import { peticion } from '../services/api';

function leerUsuarioGuardado() {
  try {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerUsuarioGuardado);

  function guardarSesion(respuesta) {
    localStorage.setItem('token', respuesta.token);
    localStorage.setItem('usuario', JSON.stringify(respuesta.usuario));
    setUsuario(respuesta.usuario);
  }

  async function iniciarSesion(correo, password) {
    const respuesta = await peticion('/auth/login', {
      metodo: 'POST',
      datos: { correo, password },
    });
    guardarSesion(respuesta);
    return respuesta.usuario;
  }

  async function registrar(datos) {
    const respuesta = await peticion('/auth/register', { metodo: 'POST', datos });
    guardarSesion(respuesta);
    return respuesta.usuario;
  }

  async function cambiarPassword(passwordActual, passwordNueva) {
    await peticion('/auth/cambiar-password', {
      metodo: 'PUT',
      datos: { passwordActual, passwordNueva },
    });
    const actualizado = { ...usuario, debeCambiarPassword: false };
    localStorage.setItem('usuario', JSON.stringify(actualizado));
    setUsuario(actualizado);
  }

  function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{ usuario, iniciarSesion, registrar, cambiarPassword, cerrarSesion }}
    >
      {children}
    </AuthContext.Provider>
  );
}
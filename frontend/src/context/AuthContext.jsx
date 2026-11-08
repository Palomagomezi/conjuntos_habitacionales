import { useState } from 'react';
import { AuthContext } from './contexto';
import { peticion } from '../services/api';
import { leerDelNavegador, guardarEnNavegador, actualizarUsuarioGuardado, borrarDelNavegador } from '../utils/sesion';

function leerUsuarioGuardado() {
  try {
    const guardado = leerDelNavegador('usuario');
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerUsuarioGuardado);

  function guardarSesion(respuesta) {
    guardarEnNavegador(respuesta.token, respuesta.usuario);
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
    actualizarUsuarioGuardado(actualizado);
    setUsuario(actualizado);
  }

  function cerrarSesion() {
    borrarDelNavegador();
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
if (sessionStorage.getItem('token') === null && localStorage.getItem('token') !== null) {
  sessionStorage.setItem('token', localStorage.getItem('token'));
  sessionStorage.setItem('usuario', localStorage.getItem('usuario'));
}

function esLaUltimaSesion() {
  return localStorage.getItem('token') === sessionStorage.getItem('token');
}

export function leerDelNavegador(clave) {
  return sessionStorage.getItem(clave);
}

export function guardarEnNavegador(token, usuario) {
  const texto = JSON.stringify(usuario);
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('usuario', texto);
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', texto);
}

export function actualizarUsuarioGuardado(usuario) {
  const texto = JSON.stringify(usuario);
  if (esLaUltimaSesion()) {
    localStorage.setItem('usuario', texto);
  }
  sessionStorage.setItem('usuario', texto);
}

export function borrarDelNavegador() {
  if (esLaUltimaSesion()) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('usuario');
}
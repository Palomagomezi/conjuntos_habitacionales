const API_URL = import.meta.env.VITE_API_URL;

export async function peticion(ruta, { metodo = 'GET', datos } = {}) {
  const token = localStorage.getItem('token');

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: datos ? JSON.stringify(datos) : undefined,
  });

  const contenido = await respuesta.json().catch(() => ({}));

   if (respuesta.status === 401 && token) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
    return;
  }

  if (!respuesta.ok) {
    throw new Error(contenido.mensaje || 'Ocurrió un error');
  }
  return contenido;
}
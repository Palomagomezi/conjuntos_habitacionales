import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import '../styles/panel.css';

const MENUS = {
  administrador: [
    { ruta: '/admin', texto: 'Inicio', exacta: true },
    { ruta: '/admin/unidades', texto: 'Unidades' },
    { ruta: '/admin/residentes', texto: 'Residentes' },
    { ruta: '/admin/finanzas', texto: 'Finanzas' },
    { ruta: '/admin/cuotas', texto: 'Cuotas' },
    { ruta: '/admin/egresos', texto: 'Egresos' },
    { ruta: '/admin/avisos', texto: 'Avisos' },
    { ruta: '/admin/asambleas', texto: 'Asambleas' },
    { ruta: '/admin/votaciones', texto: 'Votaciones' },
    { ruta: '/admin/mantenimiento', texto: 'Mantenimiento' },
  ],
  residente: [
    { ruta: '/residente', texto: 'Inicio', exacta: true },
    { ruta: '/residente/estado-cuenta', texto: 'Estado de cuenta' },
    { ruta: '/residente/avisos', texto: 'Avisos' },
    { ruta: '/residente/asambleas', texto: 'Asambleas' },
    { ruta: '/residente/votaciones', texto: 'Votaciones' },
    { ruta: '/residente/reportes', texto: 'Mantenimiento' },
  ],
};

export default function PanelLayout() {
  const { usuario, cerrarSesion } = useAuth();
  const enlaces = MENUS[usuario.rol] || [];

  return (
    <div className="panel">
      <aside className="panel-menu">
        <p className="panel-marca">Conjuntos habitacionales</p>
        <p className="panel-rol">
          {usuario.rol === 'administrador' ? 'Administrador' : 'Residente'}
        </p>

        <nav className="panel-enlaces">
          {enlaces.map((enlace) => (
            <NavLink
              key={enlace.ruta}
              to={enlace.ruta}
              end={enlace.exacta}
              className="panel-enlace"
            >
              {enlace.texto}
            </NavLink>
          ))}
        </nav>

        <div className="panel-usuario">
          <p className="panel-usuario-nombre">{usuario.nombre}</p>
          <p className="panel-usuario-correo">{usuario.correo}</p>
          <NavLink to="/cambiar-password" className="panel-enlace">
            Cambiar contraseña
          </NavLink>
          <button className="panel-salir" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="panel-contenido">
        <Outlet />
      </main>
    </div>
  );
}
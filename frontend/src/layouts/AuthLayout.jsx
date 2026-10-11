import '../styles/auth.css';

export default function AuthLayout({ titulo, subtitulo, children }) {
  return (
    <div className="auth-fondo">
      <div className="auth-tarjeta">
        <p className="auth-marca">Conjuntos habitacionales</p>
        <h1 className="auth-titulo">{titulo}</h1>
        {subtitulo && <p className="auth-subtitulo">{subtitulo}</p>}
        {children}
      </div>
    </div>
  );
}
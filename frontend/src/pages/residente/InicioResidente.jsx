import { useAuth } from '../../context/useAuth';

export default function InicioResidente() {
  const { usuario } = useAuth();

  return (
    <div className="encabezado">
      <div>
        <h1>Hola, {usuario.nombre}</h1>
        <p>Aquí podrás consultar tus pagos, los avisos del conjunto y tus reportes.</p>
      </div>
    </div>
  );
}
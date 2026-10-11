import { useEffect, useState } from 'react';
import { peticion } from './services/api';

export default function App() {
  const [estado, setEstado] = useState('Conectando...');

  useEffect(() => {
    peticion('/salud')
      .then(() => setEstado('Conectado al servidor'))
      .catch((error) => setEstado(`Error: ${error.message}`));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <div className="tarjeta">
        <h1>Conjuntos habitacionales</h1>
        <p>{estado}</p>
        <button className="boton">Botón de prueba</button>
      </div>
    </div>
  );
}
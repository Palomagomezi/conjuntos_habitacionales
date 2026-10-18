export default function ResultadosVotacion({ opciones, totalVotos, miOpcion }) {
  return (
    <div className="resultados">
      {opciones.map((opcion) => {
        const porcentaje = totalVotos > 0 ? Math.round((opcion.votos / totalVotos) * 100) : 0;

        return (
          <div key={opcion.id}>
            <div className="resultado-etiqueta">
              <span>
                {opcion.texto}
                {opcion.id === miOpcion && (
                  <span className="insignia insignia-exito resultado-mio">Tu voto</span>
                )}
              </span>
              <span className="texto-suave">
                {opcion.votos} {opcion.votos === 1 ? 'voto' : 'votos'} · {porcentaje}%
              </span>
            </div>
            <div className="barra">
              <div className="barra-relleno" style={{ width: `${porcentaje}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
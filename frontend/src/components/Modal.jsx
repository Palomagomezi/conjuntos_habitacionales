export default function Modal({ titulo, onCerrar, amplio = false, children }) {
  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div
        className={`modal ${amplio ? 'modal-amplio' : ''}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-encabezado">
          <h2>{titulo}</h2>
          <button className="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
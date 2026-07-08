'use client';

export default function ExportBar() {
  function imprimir() {
    window.print();
  }

  return (
    <div className="export-bar no-print">
      <button className="secondary" onClick={imprimir}>Imprimir / guardar PDF</button>
    </div>
  );
}

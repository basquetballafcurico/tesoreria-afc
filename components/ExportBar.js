'use client';

export default function ExportBar({ resumenTexto }) {
  function enviarCorreo() {
    const asunto = encodeURIComponent('Resumen tesorería — Club Alianza Francesa');
    const cuerpo = encodeURIComponent(resumenTexto);
    window.location.href = `mailto:?subject=${asunto}&body=${cuerpo}`;
  }

  function enviarWhatsapp() {
    const texto = encodeURIComponent(resumenTexto);
    window.open(`https://wa.me/?text=${texto}`, '_blank');
  }

  function imprimir() {
    window.print();
  }

  return (
    <div className="export-bar no-print">
      <button className="secondary" onClick={enviarCorreo}>Enviar por correo</button>
      <button className="secondary" onClick={enviarWhatsapp}>Enviar por WhatsApp</button>
      <button className="secondary" onClick={imprimir}>Imprimir / guardar PDF</button>
    </div>
  );
}

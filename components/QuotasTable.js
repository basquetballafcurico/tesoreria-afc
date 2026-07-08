const badgeClass = {
  pagado: 'badge-pagado',
  pendiente: 'badge-pendiente',
  parcial: 'badge-parcial',
  descuento: 'badge-descuento',
};

const badgeLabel = {
  pagado: 'Pagado',
  pendiente: 'Pendiente',
  parcial: 'Pago parcial',
  descuento: 'Descuento',
};

export default function QuotasTable({ filas }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table>
        <thead>
          <tr>
            <th>Jugador</th>
            <th>Periodo</th>
            <th>Monto</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.id}>
              <td>{f.nombre}</td>
              <td>{f.periodo}</td>
              <td>${Math.round(f.monto).toLocaleString('es-CL')}</td>
              <td>
                <span className={`badge ${badgeClass[f.estado] || 'badge-pendiente'}`}>
                  {badgeLabel[f.estado] || f.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

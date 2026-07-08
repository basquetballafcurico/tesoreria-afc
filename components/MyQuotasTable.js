const badgeClass = {
  pagado: 'badge-pagado',
  pendiente: 'badge-pendiente',
  parcial: 'badge-parcial',
  descuento: 'badge-descuento',
};

const badgeLabel = {
  pagado: 'Pagado',
  pendiente: 'Pendiente',
  parcial: 'Parcial',
  descuento: 'Descuento',
};

export default function MyQuotasTable({ periodos, cuotasPorPeriodo }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table>
        <thead>
          <tr>
            <th>Periodo</th>
            <th>Monto cuota</th>
            <th>Pagado</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {periodos.map((p) => {
            const c = cuotasPorPeriodo[p];
            if (!c) {
              return (
                <tr key={p}>
                  <td>{p}</td>
                  <td colSpan={3} style={{ color: 'var(--text-secondary)' }}>Sin información</td>
                </tr>
              );
            }
            return (
              <tr key={p}>
                <td>{p}</td>
                <td>${Math.round(c.monto).toLocaleString('es-CL')}</td>
                <td>${Math.round(c.monto_pagado).toLocaleString('es-CL')}</td>
                <td>
                  <span className={`badge ${badgeClass[c.estado] || 'badge-pendiente'}`}>
                    {badgeLabel[c.estado] || c.estado}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

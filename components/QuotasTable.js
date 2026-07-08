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

export default function QuotasTable({ jugadores, periodos }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table>
        <thead>
          <tr>
            <th>Jugador</th>
            {periodos.map((p) => (
              <th key={p}>{p}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jugadores.map((j) => (
            <tr key={j.nombre}>
              <td>{j.nombre}</td>
              {periodos.map((p) => {
                const c = j.cuotasPorPeriodo[p];
                if (!c) return <td key={p} style={{ color: 'var(--text-secondary)' }}>—</td>;
                return (
                  <td key={p}>
                    <span className={`badge ${badgeClass[c.estado] || 'badge-pendiente'}`}>
                      {badgeLabel[c.estado] || c.estado}
                    </span>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      ${Math.round(c.monto_pagado).toLocaleString('es-CL')} / ${Math.round(c.monto).toLocaleString('es-CL')}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

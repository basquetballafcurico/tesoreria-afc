export default function PeriodStatusCards({ periodos, jugadoresConCuotas, totalSocios }) {
  return (
    <div className="kpi-grid" style={{ gridTemplateColumns: `repeat(${periodos.length}, 1fr)` }}>
      {periodos.map((p) => {
        const alDia = jugadoresConCuotas.filter((j) => {
          const c = j.cuotasPorPeriodo[p];
          return c && (c.estado === 'pagado' || c.estado === 'descuento');
        }).length;
        return (
          <div key={p} className="card">
            <p className="kpi-label">Socios al día — {p}</p>
            <p className="kpi-value">{alDia}/{totalSocios}</p>
          </div>
        );
      })}
    </div>
  );
}

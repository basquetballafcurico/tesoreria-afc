export default function KpiCards({ ingresos, egresos, saldo }) {
  const fmt = (n) => '$' + Math.round(n).toLocaleString('es-CL');

  const items = [
    { label: 'Ingresos año', value: fmt(ingresos) },
    { label: 'Egresos año', value: fmt(egresos) },
    { label: 'Saldo actual', value: fmt(saldo), highlight: true },
  ];

  return (
    <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
      {items.map((item) => (
        <div
          key={item.label}
          className="card"
          style={item.highlight ? { background: 'var(--success-bg)' } : {}}
        >
          <p className="kpi-label" style={item.highlight ? { color: 'var(--success-text)' } : {}}>
            {item.label}
          </p>
          <p className="kpi-value" style={item.highlight ? { color: 'var(--success-text)' } : {}}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

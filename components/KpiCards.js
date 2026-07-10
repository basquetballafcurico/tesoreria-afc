export default function KpiCards({ ingresos, egresos, saldo, saldoInicial }) {
  const fmt = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CL');
  const totalIngresoMasSaldoAnterior = (Number(ingresos) || 0) + (Number(saldoInicial) || 0);

  const items = [
    {
      label: `Ingreso año 2026: ${fmt(ingresos)} + Saldo 2025: ${fmt(saldoInicial)}`,
      value: fmt(totalIngresoMasSaldoAnterior),
    },
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

'use client';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORES = ['#2a78d6', '#e07a3e', '#4a9d6e', '#c25a5a', '#8a6bbf', '#c3a63e', '#5aa8a8', '#a3623e'];

export default function ExpensesPieChart({ gastos }) {
  const totalesPorConcepto = {};
  gastos.forEach((g) => {
    const clave = g.concepto || 'Otros';
    totalesPorConcepto[clave] = (totalesPorConcepto[clave] || 0) + Number(g.monto || 0);
  });

  const etiquetas = Object.keys(totalesPorConcepto);
  const valores = Object.values(totalesPorConcepto);
  const total = valores.reduce((a, b) => a + b, 0);

  if (etiquetas.length === 0) {
    return <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Todavía no hay gastos cargados.</p>;
  }

  const data = {
    labels: etiquetas,
    datasets: [
      {
        data: valores,
        backgroundColor: etiquetas.map((_, i) => COLORES[i % COLORES.length]),
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { boxWidth: 12, font: { size: 12 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const valor = ctx.raw;
            const pct = total ? Math.round((valor / total) * 100) : 0;
            return ` ${ctx.label}: $${Math.round(valor).toLocaleString('es-CL')} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ position: 'relative', height: 260 }}>
      <Pie data={data} options={options} />
    </div>
  );
}

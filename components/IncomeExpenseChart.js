'use client';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function IncomeExpenseChart({ periodos, ingresos, egresos }) {
  const data = {
    labels: periodos,
    datasets: [
      { label: 'Ingresos', data: ingresos, backgroundColor: '#2a78d6', borderRadius: 4, maxBarThickness: 28 },
      { label: 'Egresos', data: egresos, backgroundColor: '#c3c2b7', borderRadius: 4, maxBarThickness: 28 },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { ticks: { callback: (v) => '$' + v / 1000 + 'k' } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#2a78d6', borderRadius: 2, marginRight: 4 }} />Ingresos</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#c3c2b7', borderRadius: 2, marginRight: 4 }} />Egresos</span>
      </div>
      <div style={{ position: 'relative', height: 240 }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import KpiCards from '../../components/KpiCards';
import PeriodStatusCards from '../../components/PeriodStatusCards';
import IncomeExpenseChart from '../../components/IncomeExpenseChart';
import QuotasTable from '../../components/QuotasTable';
import MyQuotasTable from '../../components/MyQuotasTable';
import ExportBar from '../../components/ExportBar';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [jugadores, setJugadores] = useState([]);

  useEffect(() => {
    async function cargar() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: perfilData } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setPerfil(perfilData);

      const { data: cuotasData } = await supabase.from('cuotas').select('*');
      const { data: gastosData } = await supabase.from('gastos').select('*');
      const { data: jugadoresData } = await supabase.from('jugadores').select('*');

      setCuotas(cuotasData || []);
      setGastos(gastosData || []);
      setJugadores(jugadoresData || []);
      setLoading(false);
    }
    cargar();
  }, [router]);

  if (loading) {
    return <div className="container">Cargando…</div>;
  }

  const esAdmin = perfil?.rol === 'admin';
  const periodos = [...new Set(cuotas.map((c) => c.periodo))].sort();

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }} className="no-print">
      <div>
        <p style={{ fontWeight: 600, margin: 0 }}>Tesorería — Club Alianza Francés</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          {esAdmin ? 'Vista de dirigente' : 'Tu estado de cuenta'}
        </p>
      </div>
      <button className="secondary" onClick={cerrarSesion}>Cerrar sesión</button>
    </div>
  );

  if (!esAdmin) {
    const cuotasPorPeriodo = {};
    cuotas.forEach((c) => { cuotasPorPeriodo[c.periodo] = c; });

    const totalPagado = cuotas.reduce((acc, c) => acc + Number(c.monto_pagado || 0), 0);
    const totalPendiente = cuotas.reduce(
      (acc, c) => acc + Math.max(Number(c.monto || 0) - Number(c.monto_pagado || 0), 0), 0
    );

    return (
      <div className="container">
        {header}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="card">
            <p className="kpi-label">Pagado este año</p>
            <p className="kpi-value">${Math.round(totalPagado).toLocaleString('es-CL')}</p>
          </div>
          <div
            className="card"
            style={totalPendiente > 0 ? { background: 'var(--warning-bg)' } : { background: 'var(--success-bg)' }}
          >
            <p className="kpi-label" style={{ color: totalPendiente > 0 ? 'var(--warning-text)' : 'var(--success-text)' }}>
              Monto pendiente
            </p>
            <p className="kpi-value" style={{ color: totalPendiente > 0 ? 'var(--warning-text)' : 'var(--success-text)' }}>
              ${Math.round(totalPendiente).toLocaleString('es-CL')}
            </p>
          </div>
        </div>

        <p style={{ fontWeight: 500 }}>Tus cuotas</p>
        <MyQuotasTable periodos={periodos} cuotasPorPeriodo={cuotasPorPeriodo} />
      </div>
    );
  }

  const nombrePorId = Object.fromEntries(jugadores.map((j) => [j.id, j.nombre]));

  const jugadoresConCuotas = jugadores.map((j) => {
    const cuotasPorPeriodo = {};
    cuotas
      .filter((c) => c.jugador_id === j.id)
      .forEach((c) => { cuotasPorPeriodo[c.periodo] = c; });
    return { nombre: j.nombre, cuotasPorPeriodo };
  });

  const totalIngresos = cuotas.reduce((acc, c) => acc + Number(c.monto_pagado || 0), 0);
  const totalEgresos = gastos.reduce((acc, g) => acc + Number(g.monto || 0), 0);
  const saldo = totalIngresos - totalEgresos;

  const sociosAlDia = jugadoresConCuotas.filter((j) =>
    Object.values(j.cuotasPorPeriodo).length > 0 &&
    Object.values(j.cuotasPorPeriodo).every((c) => c.estado === 'pagado' || c.estado === 'descuento')
  ).length;

  const ingresosPorPeriodo = periodos.map((p) =>
    cuotas.filter((c) => c.periodo === p).reduce((a, c) => a + Number(c.monto_pagado || 0), 0)
  );
  const egresosPorPeriodo = periodos.map(() => Math.round(totalEgresos / (periodos.length || 1)));

  const resumenTexto =
    `Resumen tesorería — Club Alianza Francés\n\n` +
    `Ingresos año: $${Math.round(totalIngresos).toLocaleString('es-CL')}\n` +
    `Egresos año: $${Math.round(totalEgresos).toLocaleString('es-CL')}\n` +
    `Saldo actual: $${Math.round(saldo).toLocaleString('es-CL')}\n` +
    `Socios al día: ${sociosAlDia}/${jugadores.length}\n`;

  return (
    <div className="container">
      {header}

      <KpiCards
        ingresos={totalIngresos}
        egresos={totalEgresos}
        saldo={saldo}
      />

      <div style={{ marginBottom: '1.5rem' }}>
        <PeriodStatusCards
          periodos={periodos}
          jugadoresConCuotas={jugadoresConCuotas}
          totalSocios={jugadores.length}
        />
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontWeight: 500, marginTop: 0 }}>Ingresos vs egresos</p>
        <IncomeExpenseChart periodos={periodos} ingresos={ingresosPorPeriodo} egresos={egresosPorPeriodo} />
      </div>

      <p style={{ fontWeight: 500 }}>Estado de cuotas</p>
      <QuotasTable jugadores={jugadoresConCuotas} periodos={periodos} />

      <ExportBar resumenTexto={resumenTexto} />
    </div>
  );
}

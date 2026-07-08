'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import KpiCards from '../../components/KpiCards';
import IncomeExpenseChart from '../../components/IncomeExpenseChart';
import QuotasTable from '../../components/QuotasTable';
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

  const nombrePorId = Object.fromEntries(jugadores.map((j) => [j.id, j.nombre]));

  const filasTabla = cuotas.map((c) => ({
    ...c,
    nombre: nombrePorId[c.jugador_id] || 'Jugador',
  }));

  const totalIngresos = cuotas.reduce((acc, c) => acc + Number(c.monto_pagado || 0), 0);
  const totalEgresos = gastos.reduce((acc, g) => acc + Number(g.monto || 0), 0);
  const saldo = totalIngresos - totalEgresos;

  const periodos = [...new Set(cuotas.map((c) => c.periodo))].sort();
  const periodoActual = periodos[periodos.length - 1];
  const sociosAlDia = cuotas.filter(
    (c) => c.periodo === periodoActual && c.estado === 'pagado'
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

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }} className="no-print">
        <div>
          <p style={{ fontWeight: 600, margin: 0 }}>Tesorería — Club Alianza Francés</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            {perfil?.rol === 'admin' ? 'Vista de dirigente' : 'Tu estado de cuenta'}
          </p>
        </div>
        <button className="secondary" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>

      <KpiCards
        ingresos={totalIngresos}
        egresos={totalEgresos}
        saldo={saldo}
        sociosAlDia={sociosAlDia}
        totalSocios={jugadores.length || filasTabla.length}
      />

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontWeight: 500, marginTop: 0 }}>Ingresos vs egresos</p>
        <IncomeExpenseChart periodos={periodos} ingresos={ingresosPorPeriodo} egresos={egresosPorPeriodo} />
      </div>

      <p style={{ fontWeight: 500 }}>Estado de cuotas</p>
      <QuotasTable filas={filasTabla} />

      <ExportBar resumenTexto={resumenTexto} />
    </div>
  );
}

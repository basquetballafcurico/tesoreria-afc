'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import KpiCards from '../../components/KpiCards';
import PeriodStatusCards from '../../components/PeriodStatusCards';
import IncomeExpenseChart from '../../components/IncomeExpenseChart';
import ExpensesPieChart from '../../components/ExpensesPieChart';
import QuotasTable from '../../components/QuotasTable';
import MyQuotasTable from '../../components/MyQuotasTable';
import ExportBar from '../../components/ExportBar';
import ChangePasswordCard from '../../components/ChangePasswordCard';
import InventoryTable from '../../components/InventoryTable';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [saldoInicial, setSaldoInicial] = useState(0);

  const [misDatosEquipo, setMisDatosEquipo] = useState({
    tiene_camiseta: false, numero_camiseta: '', tiene_salida_cancha: false,
  });
  const [guardandoEquipo, setGuardandoEquipo] = useState(false);
  const [mensajeEquipo, setMensajeEquipo] = useState('');
  const [mensajeEquipoTipo, setMensajeEquipoTipo] = useState('success');

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
      const { data: inventarioData } = await supabase.from('inventario').select('*').order('categoria');

      setCuotas(cuotasData || []);
      setGastos(gastosData || []);
      setJugadores(jugadoresData || []);
      setInventario(inventarioData || []);

      const { data: configData } = await supabase.from('configuracion').select('*').eq('clave', 'saldo_inicial_2025').single();
      setSaldoInicial(configData ? Number(configData.valor) : 0);

      setLoading(false);

      if (perfilData?.jugador_id) {
        const mio = (jugadoresData || []).find((j) => j.id === perfilData.jugador_id);
        if (mio) {
          setMisDatosEquipo({
            tiene_camiseta: mio.tiene_camiseta || false,
            numero_camiseta: mio.numero_camiseta ?? '',
            tiene_salida_cancha: mio.tiene_salida_cancha || false,
          });
        }
      }
    }
    cargar();
  }, [router]);

  async function guardarMisDatos(e) {
    e.preventDefault();
    if (!perfil?.jugador_id) return;
    setGuardandoEquipo(true);
    const numero = misDatosEquipo.numero_camiseta === '' ? null : Number(misDatosEquipo.numero_camiseta);
    const { error } = await supabase
      .from('jugadores')
      .update({
        tiene_camiseta: misDatosEquipo.tiene_camiseta,
        numero_camiseta: numero,
        tiene_salida_cancha: misDatosEquipo.tiene_salida_cancha,
      })
      .eq('id', perfil.jugador_id);
    setGuardandoEquipo(false);
    if (!error) {
      setJugadores((prev) =>
        prev.map((j) =>
          j.id === perfil.jugador_id
            ? { ...j, tiene_camiseta: misDatosEquipo.tiene_camiseta, numero_camiseta: numero, tiene_salida_cancha: misDatosEquipo.tiene_salida_cancha }
            : j
        )
      );
      setMensajeEquipo('Datos guardados correctamente.');
      setMensajeEquipoTipo('success');
    } else {
      setMensajeEquipo('No se pudo guardar. Intenta de nuevo.');
      setMensajeEquipoTipo('error');
    }
  }

  useEffect(() => {
    if (!mensajeEquipo) return;
    const t = setTimeout(() => setMensajeEquipo(''), 4000);
    return () => clearTimeout(t);
  }, [mensajeEquipo]);

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="/logo-af.png" alt="Logo Alianza Francesa Basket" style={{ width: 40, height: 40 }} />
        <div>
          <p style={{ fontWeight: 600, margin: 0 }}>Tesorería — Club Alianza Francesa</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            {esAdmin ? 'Vista de dirigente' : 'Tu estado de cuenta'}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {esAdmin && (
          <button className="secondary" onClick={() => router.push('/admin')}>Administración</button>
        )}
        <button className="secondary" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>
    </div>
  );

  if (!esAdmin) {
    const miJugador = jugadores.find((j) => j.id === perfil?.jugador_id);
    const cuotasPorPeriodo = {};
    cuotas.forEach((c) => { cuotasPorPeriodo[c.periodo] = c; });

    const totalPagado = cuotas.reduce((acc, c) => acc + Number(c.monto_pagado || 0), 0);
    const totalPendiente = cuotas.reduce(
      (acc, c) => acc + Math.max(Number(c.monto || 0) - Number(c.monto_pagado || 0), 0), 0
    );

    return (
      <div className="container">
        {header}

        {miJugador && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontWeight: 500, marginTop: 0, marginBottom: 12 }}>Mis datos</p>
            <table>
              <tbody>
                <tr>
                  <td style={{ color: 'var(--text-secondary)', width: 160 }}>Nombre</td>
                  <td>{miJugador.nombre}</td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--text-secondary)' }}>Correo</td>
                  <td>{miJugador.email}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

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

        <p style={{ fontWeight: 500, marginTop: '1.5rem' }}>Inventario del club</p>
        <InventoryTable items={inventario} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: '1.5rem' }}>
          <ChangePasswordCard />

          <div className="card no-print" style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontWeight: 500, marginTop: 0, marginBottom: 12 }}>Mi equipo</p>
            {mensajeEquipo && (
              <div
                style={{
                  marginBottom: 12,
                  padding: '0.6rem 0.8rem',
                  borderRadius: 8,
                  background: mensajeEquipoTipo === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: mensajeEquipoTipo === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
                  fontWeight: 500,
                  fontSize: 14,
                }}
              >
                {mensajeEquipoTipo === 'success' ? '✓ ' : '⚠ '}{mensajeEquipo}
              </div>
            )}
            <form onSubmit={guardarMisDatos} style={{ display: 'grid', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={misDatosEquipo.tiene_camiseta}
                  onChange={(e) => setMisDatosEquipo({ ...misDatosEquipo, tiene_camiseta: e.target.checked })}
                />
                Tengo camiseta
              </label>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Número de camiseta
                </label>
                <input
                  type="number"
                  placeholder="Ej: 7"
                  value={misDatosEquipo.numero_camiseta}
                  onChange={(e) => setMisDatosEquipo({ ...misDatosEquipo, numero_camiseta: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={misDatosEquipo.tiene_salida_cancha}
                  onChange={(e) => setMisDatosEquipo({ ...misDatosEquipo, tiene_salida_cancha: e.target.checked })}
                />
                Tengo salida de cancha
              </label>
              <button type="submit" disabled={guardandoEquipo}>
                {guardandoEquipo ? 'Guardando…' : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const jugadoresConCuotas = jugadores.map((j) => {
    const cuotasPorPeriodo = {};
    cuotas
      .filter((c) => c.jugador_id === j.id)
      .forEach((c) => { cuotasPorPeriodo[c.periodo] = c; });
    return {
      nombre: j.nombre,
      tieneCamiseta: j.tiene_camiseta,
      numeroCamiseta: j.numero_camiseta,
      tieneSalidaCancha: j.tiene_salida_cancha,
      cuotasPorPeriodo,
    };
  });

  const totalIngresos = cuotas.reduce((acc, c) => acc + Number(c.monto_pagado || 0), 0);
  const totalEgresos = gastos.reduce((acc, g) => acc + Number(g.monto || 0), 0);
  const saldo = saldoInicial + totalIngresos - totalEgresos;

  const sociosAlDia = jugadoresConCuotas.filter((j) =>
    Object.values(j.cuotasPorPeriodo).length > 0 &&
    Object.values(j.cuotasPorPeriodo).every((c) => c.estado === 'pagado' || c.estado === 'descuento')
  ).length;

  const ingresosPorPeriodo = periodos.map((p) =>
    cuotas.filter((c) => c.periodo === p).reduce((a, c) => a + Number(c.monto_pagado || 0), 0)
  );
  const egresosPorPeriodo = periodos.map(() => Math.round(totalEgresos / (periodos.length || 1)));

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

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontWeight: 500, marginTop: 0 }}>Gastos por concepto</p>
        <ExpensesPieChart gastos={gastos} />
      </div>

      <p style={{ fontWeight: 500 }}>Estado de cuotas</p>
      <QuotasTable jugadores={jugadoresConCuotas} periodos={periodos} />

      <p style={{ fontWeight: 500, marginTop: '1.5rem' }}>Inventario del club</p>
      <InventoryTable items={inventario} />

      <ExportBar
        ingresos={totalIngresos}
        egresos={totalEgresos}
        saldo={saldo}
        periodos={periodos}
        jugadoresConCuotas={jugadoresConCuotas}
        totalSocios={jugadores.length}
      />

      <div style={{ marginTop: '1.5rem' }}>
        <ChangePasswordCard />
      </div>
    </div>
  );
}

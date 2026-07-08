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
import ChangePasswordCard from '../../components/ChangePasswordCard';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [jugadores, setJugadores] = useState([]);

  const [misDatosEquipo, setMisDatosEquipo] = useState({
    tiene_camiseta: false, numero_camiseta: '', tiene_salida_cancha: false,
  });
  const [guardandoEquipo, setGuardandoEquipo] = useState(false);
  const [mensajeEquipo, setMensajeEquipo] = useState('');

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
      setMensajeEquipo('Datos guardados.');
    } else {
      setMensajeEquipo('No se pudo guardar. Intenta de nuevo.');
    }
  }

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
        <p style={{ fontWeight: 600, margin: 0 }}>Tesorería — Club Alianza Francesa</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          {esAdmin ? 'Vista de dirigente' : 'Tu estado de cuenta'}
        </p>
      </div>
      <button className="secondary" onClick={cerrarSesion}>Cerrar sesión</button>
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
            <p className="kpi-label">Pagado este

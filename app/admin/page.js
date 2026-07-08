'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function AdminPage() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [jugadores, setJugadores] = useState([]);
  const [mensaje, setMensaje] = useState('');

  const [cuota, setCuota] = useState({ jugador_id: '', periodo: 'T3 2026', monto: 60000, monto_pagado: 0, estado: 'pendiente' });
  const [gasto, setGasto] = useState({ fecha: '', concepto: '', monto: '' });
  const [datosJugador, setDatosJugador] = useState({
    jugador_id: '', tiene_camiseta: false, numero_camiseta: '', tiene_salida_cancha: false,
  });

  useEffect(() => {
    async function verificar() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', session.user.id).single();
      if (perfil?.rol !== 'admin') { router.push('/dashboard'); return; }
      setAutorizado(true);
      const { data } = await supabase.from('jugadores').select('*').order('nombre');
      setJugadores(data || []);
    }
    verificar();
  }, [router]);

  async function guardarCuota(e) {
    e.preventDefault();
    const { error } = await supabase.from('cuotas').insert([cuota]);
    setMensaje(error ? 'Error al guardar la cuota.' : 'Cuota guardada.');
  }

  async function guardarGasto(e) {
    e.preventDefault();
    const { error } = await supabase.from('gastos').insert([gasto]);
    setMensaje(error ? 'Error al guardar el gasto.' : 'Gasto guardado.');
  }

  function seleccionarJugador(id) {
    const j = jugadores.find((x) => String(x.id) === String(id));
    setDatosJugador({
      jugador_id: id,
      tiene_camiseta: j?.tiene_camiseta || false,
      numero_camiseta: j?.numero_camiseta ?? '',
      tiene_salida_cancha: j?.tiene_salida_cancha || false,
    });
  }

  async function guardarDatosJugador(e) {
    e.preventDefault();
    const { error } = await supabase
      .from('jugadores')
      .update({
        tiene_camiseta: datosJugador.tiene_camiseta,
        numero_camiseta: datosJugador.numero_camiseta === '' ? null : Number(datosJugador.numero_camiseta),
        tiene_salida_cancha: datosJugador.tiene_salida_cancha,
      })
      .eq('id', datosJugador.jugador_id);
    if (!error) {
      const { data } = await supabase.from('jugadores').select('*').order('nombre');
      setJugadores(data || []);
    }
    setMensaje(error ? 'Error al guardar los datos del jugador.' : 'Datos del jugador actualizados.');
  }

  if (!autorizado) return <div className="container">Verificando acceso…</div>;

  return (
    <div className="container">
      <p style={{ fontWeight: 600 }}>Administración — cargar movimientos</p>
      {mensaje && <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{mensaje}</p>}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontWeight: 500, marginTop: 0 }}>Registrar cuota</p>
        <form onSubmit={guardarCuota} style={{ display: 'grid', gap: 10 }}>
          <select value={cuota.jugador_id} onChange={(e) => setCuota({ ...cuota, jugador_id: e.target.value })} required>
            <option value="">Selecciona jugador</option>
            {jugadores.map((j) => <option key={j.id} value={j.id}>{j.nombre}</option>)}
          </select>
          <input placeholder="Periodo (ej: T3 2026)" value={cuota.periodo} onChange={(e) => setCuota({ ...cuota, periodo: e.target.value })} required />
          <input type="number" placeholder="Monto cuota" value={cuota.monto} onChange={(e) => setCuota({ ...cuota, monto: Number(e.target.value) })} required />
          <input type="number" placeholder="Monto pagado" value={cuota.monto_pagado} onChange={(e) => setCuota({ ...cuota, monto_pagado: Number(e.target.value) })} />
          <select value={cuota.estado} onChange={(e) => setCuota({ ...cuota, estado: e.target.value })}>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
            <option value="parcial">Pago parcial</option>
            <option value="descuento">Descuento</option>
          </select>
          <button type="submit">Guardar cuota</button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontWeight: 500, marginTop: 0 }}>Registrar gasto</p>
        <form onSubmit={guardarGasto} style={{ display: 'grid', gap: 10 }}>
          <input type="date" value={gasto.fecha} onChange={(e) => setGasto({ ...gasto, fecha: e.target.value })} required />
          <input placeholder="Concepto (ej: Arriendo gimnasio)" value={gasto.concepto} onChange={(e) => setGasto({ ...gasto, concepto: e.target.value })} required />
          <input type="number" placeholder="Monto" value={gasto.monto} onChange={(e) => setGasto({ ...gasto, monto: Number(e.target.value) })} required />
          <button type="submit">Guardar gasto</button>
        </form>
      </div>

      <div className="card">
        <p style={{ fontWeight: 500, marginTop: 0 }}>Camiseta y salida de cancha</p>
        <form onSubmit={guardarDatosJugador} style={{ display: 'grid', gap: 10 }}>
          <select value={datosJugador.jugador_id} onChange={(e) => seleccionarJugador(e.target.value)} required>
            <option value="">Selecciona jugador</option>
            {jugadores.map((j) => <option key={j.id} value={j.id}>{j.nombre}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={datosJugador.tiene_camiseta}
              onChange={(e) => setDatosJugador({ ...datosJugador, tiene_camiseta: e.target.checked })}
            />
            Tiene camiseta
          </label>
          <input
            type="number"
            placeholder="Número de camiseta"
            value={datosJugador.numero_camiseta}
            onChange={(e) => setDatosJugador({ ...datosJugador, numero_camiseta: e.target.value })}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={datosJugador.tiene_salida_cancha}
              onChange={(e) => setDatosJugador({ ...datosJugador, tiene_salida_cancha: e.target.checked })}
            />
            Tiene salida de cancha
          </label>
          <button type="submit" disabled={!datosJugador.jugador_id}>Guardar datos</button>
        </form>
      </div>
    </div>
  );
}

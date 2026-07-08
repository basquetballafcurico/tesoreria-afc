'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function AdminPage() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [jugadores, setJugadores] = useState([]);
  const [cuotas, setCuotas] = useState([]);
  const [mensaje, setMensaje] = useState('');

  const periodosConocidos = ['T1 2026', 'T2 2026', 'T3 2026'];

  const [pago, setPago] = useState({
    jugador_id: '', periodo: '', monto: 60000, monto_pagado: 0, estado: 'pendiente', observaciones: '',
  });
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
      const { data: jugadoresData } = await supabase.from('jugadores').select('*').order('nombre');
      setJugadores(jugadoresData || []);
      const { data: cuotasData } = await supabase.from('cuotas').select('*');
      setCuotas(cuotasData || []);
    }
    verificar();
  }, [router]);

  function cargarCuotaExistente(jugadorId, periodo) {
    if (!jugadorId || !periodo) return;
    const existente = cuotas.find(
      (c) => String(c.jugador_id) === String(jugadorId) && c.periodo === periodo
    );
    if (existente) {
      setPago({
        jugador_id: jugadorId,
        periodo,
        monto: existente.monto,
        monto_pagado: existente.monto_pagado,
        estado: existente.estado,
        observaciones: existente.observaciones || '',
      });
    } else {
      setPago({
        jugador_id: jugadorId, periodo, monto: 60000, monto_pagado: 0, estado: 'pendiente', observaciones: '',
      });
    }
  }

  async function guardarPago(e) {
    e.preventDefault();
    const { error } = await supabase
      .from('cuotas')
      .upsert(
        [{
          jugador_id: pago.jugador_id,
          periodo: pago.periodo,
          monto: pago.monto,
          monto_pagado: pago.monto_pagado,
          estado: pago.estado,
          observaciones: pago.observaciones,
        }],
        { onConflict: 'jugador_id,periodo' }
      );
    if (!error) {
      const { data: cuotasData } = await supabase.from('cuotas').select('*');
      setCuotas(cuotasData || []);
    }
    setMensaje(error ? 'Error al guardar el pago.' : 'Pago guardado.');
  }

  async function guardarGasto(e) {
    e.preventDefault();
    const { error } = await supabase.from('gastos').insert([gasto]);
    setMensaje(error ? 'Error al guardar el gasto.' : 'Gasto guardado.');
    if (!error) setGasto({ fecha: '', concepto: '', monto: '' });
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
      <p style={{ fontWeight: 600 }}>Administración</p>
      {mensaje && <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{mensaje}</p>}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontWeight: 500, marginTop: 0 }}>Registrar / actualizar pago de cuota</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: -6 }}>
          Elige jugador y periodo: si ya existe una cuota cargada, se completa sola para que la corrijas.
        </p>
        <form onSubmit={guardarPago} style={{ display: 'grid', gap: 10 }}>
          <select
            value={pago.jugador_id}
            onChange={(e) => cargarCuotaExistente(e.target.value, pago.periodo)}
            required
          >
            <option value="">Selecciona jugador</option>
            {jugadores.map((j) => <option key={j.id} value={j.id}>{j.nombre}</option>)}
          </select>

          <select
            value={pago.periodo}
            onChange={(e) => cargarCuotaExistente(pago.jugador_id, e.target.value)}
            required
          >
            <option value="">Selecciona periodo</option>
            {periodosConocidos.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Monto de la cuota (lo que corresponde pagar)
            </label>
            <input
              type="number"
              value={pago.monto}
              onChange={(e) => setPago({ ...pago, monto: Number(e.target.value) })}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Monto pagado hasta ahora
            </label>
            <input
              type="number"
              value={pago.monto_pagado}
              onChange={(e) => setPago({ ...pago, monto_pagado: Number(e.target.value) })}
            />
          </div>

          <select value={pago.estado} onChange={(e) => setPago({ ...pago, estado: e.target.value })}>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
            <option value="parcial">Pago parcial</option>
            <option value="descuento">Descuento / acuerdo especial</option>
          </select>

          <input
            placeholder="Observaciones (opcional)"
            value={pago.observaciones}
            onChange={(e) => setPago({ ...pago, observaciones: e.target.value })}
          />

          <button type="submit" disabled={!pago.jugador_id || !pago.periodo}>Guardar pago</button>
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

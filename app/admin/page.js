'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function AdminPage() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [jugadores, setJugadores] = useState([]);
  const [cuotas, setCuotas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [mensajeTipo, setMensajeTipo] = useState('success');

  const periodosConocidos = ['T1 2026', 'T2 2026', 'T3 2026'];

  const [pago, setPago] = useState({
    jugador_id: '', periodo: '', monto: 60000, monto_pagado: 0, estado: 'pendiente', observaciones: '',
  });
  const [gasto, setGasto] = useState({ fecha: '', concepto: '', monto: '' });
  const [datosJugador, setDatosJugador] = useState({
    jugador_id: '', tiene_camiseta: false, numero_camiseta: '', tiene_salida_cancha: false,
  });
  const [item, setItem] = useState({
    id: null, nombre: '', categoria: 'Pelotas', cantidad: 1, estado: 'bueno', notas: '',
  });

  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(() => setMensaje(''), 4000);
    return () => clearTimeout(t);
  }, [mensaje]);

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
      const { data: inventarioData } = await supabase.from('inventario').select('*').order('categoria');
      setInventario(inventarioData || []);
    }
    verificar();
  }, [router]);

  function mostrarMensaje(texto, tipo) {
    setMensaje(texto);
    setMensajeTipo(tipo);
  }

  function cargarCuotaExistente(jugadorId, periodo) {
    const existente = (jugadorId && periodo)
      ? cuotas.find((c) => String(c.jugador_id) === String(jugadorId) && c.periodo === periodo)
      : null;

    setPago({
      jugador_id: jugadorId,
      periodo,
      monto: existente ? existente.monto : 60000,
      monto_pagado: existente ? existente.monto_pagado : 0,
      estado: existente ? existente.estado : 'pendiente',
      observaciones: existente ? (existente.observaciones || '') : '',
    });
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
    mostrarMensaje(error ? 'Error al guardar el pago.' : 'Pago guardado correctamente.', error ? 'error' : 'success');
  }

  async function guardarGasto(e) {
    e.preventDefault();
    const { error } = await supabase.from('gastos').insert([gasto]);
    mostrarMensaje(error ? 'Error al guardar el gasto.' : 'Gasto guardado correctamente.', error ? 'error' : 'success');
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
    mostrarMensaje(error ? 'Error al guardar los datos del jugador.' : 'Datos del jugador actualizados correctamente.', error ? 'error' : 'success');
  }

  const [enviandoRecordatorios, setEnviandoRecordatorios] = useState(false);
  const [correoPrueba, setCorreoPrueba] = useState('');

  async function enviarRecordatoriosAhora(modoPrueba) {
    if (modoPrueba && !correoPrueba) {
      mostrarMensaje('Escribe tu correo arriba para hacer la prueba.', 'error');
      return;
    }
    setEnviandoRecordatorios(true);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await fetch('/api/recordatorios', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correoPrueba: modoPrueba ? correoPrueba : null }),
      });
      const data = await res.json();
      mostrarMensaje(res.ok ? `Recordatorios enviados correctamente: ${data.enviados}` : `Error: ${data.error}`, res.ok ? 'success' : 'error');
    } catch (e) {
      mostrarMensaje('No se pudo conectar con el servidor.', 'error');
    }
    setEnviandoRecordatorios(false);
  }

  async function guardarItem(e) {
    e.preventDefault();
    const datos = {
      nombre: item.nombre,
      categoria: item.categoria,
      cantidad: Number(item.cantidad),
      estado: item.estado,
      notas: item.notas,
    };
    let error;
    if (item.id) {
      ({ error } = await supabase.from('inventario').update(datos).eq('id', item.id));
    } else {
      ({ error } = await supabase.from('inventario').insert([datos]));
    }
    if (!error) {
      const { data } = await supabase.from('inventario').select('*').order('categoria');
      setInventario(data || []);
      setItem({ id: null, nombre: '', categoria: 'Pelotas', cantidad: 1, estado: 'bueno', notas: '' });
    }
    mostrarMensaje(error ? 'Error al guardar el artículo.' : 'Artículo guardado correctamente.', error ? 'error' : 'success');
  }

  function editarItem(i) {
    setItem({
      id: i.id, nombre: i.nombre, categoria: i.categoria, cantidad: i.cantidad, estado: i.estado, notas: i.notas || '',
    });
  }

  async function borrarItem(id) {
    const { error } = await supabase.from('inventario').delete().eq('id', id);
    if (!error) {
      setInventario((prev) => prev.filter((i) => i.id !== id));
    }
    mostrarMensaje(error ? 'Error al borrar el artículo.' : 'Artículo borrado correctamente.', error ? 'error' : 'success');
  }

  if (!autorizado) return <div className="container">Verificando acceso…</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontWeight: 600 }}>Administración</p>
        <button className="secondary" onClick={() => router.push('/dashboard')}>Volver al dashboard</button>
      </div>
      {mensaje && (
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            padding: '0.75rem 1rem',
            background: mensajeTipo === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: mensajeTipo === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
            fontWeight: 500,
          }}
        >
          {mensajeTipo === 'success' ? '✓ ' : '⚠ '}{mensaje}
        </div>
      )}

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
        <p style={{ fontWeight: 500, marginTop: 0 }}>Recordatorios de pago</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: -6 }}>
          Se envían solos el día 1 de cada mes a quienes tengan cuotas pendientes.
        </p>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Tu correo (para probar antes de mandar a todos)
          </label>
          <input
            type="email"
            placeholder="tu-correo@ejemplo.cl"
            value={correoPrueba}
            onChange={(e) => setCorreoPrueba(e.target.value)}
            style={{ width: '100%', maxWidth: 320 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="secondary" onClick={() => enviarRecordatoriosAhora(true)} disabled={enviandoRecordatorios}>
            {enviandoRecordatorios ? 'Enviando…' : 'Probar (todo llega a mi correo)'}
          </button>
          <button onClick={() => enviarRecordatoriosAhora(false)} disabled={enviandoRecordatorios}>
            {enviandoRecordatorios ? 'Enviando…' : 'Enviar de verdad a todos los jugadores'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontWeight: 500, marginTop: 0 }}>Inventario del club</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: -6 }}>
          Visible para todos (jugadores y admin). Solo tú puedes agregar, editar o borrar.
        </p>
        <form onSubmit={guardarItem} style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
          <input
            placeholder="Nombre del artículo (ej: Pelotas talla 7)"
            value={item.nombre}
            onChange={(e) => setItem({ ...item, nombre: e.target.value })}
            required
          />
          <select value={item.categoria} onChange={(e) => setItem({ ...item, categoria: e.target.value })}>
            <option value="Pelotas">Pelotas</option>
            <option value="Petos">Petos</option>
            <option value="Botiquín">Botiquín</option>
            <option value="Uniformes">Uniformes</option>
            <option value="Otros">Otros</option>
          </select>
          <input
            type="number"
            placeholder="Cantidad"
            value={item.cantidad}
            onChange={(e) => setItem({ ...item, cantidad: e.target.value })}
            min="0"
            required
          />
          <select value={item.estado} onChange={(e) => setItem({ ...item, estado: e.target.value })}>
            <option value="bueno">Bueno</option>
            <option value="regular">Regular</option>
            <option value="malo">Malo</option>
            <option value="perdido">Perdido</option>
          </select>
          <input
            placeholder="Notas (opcional)"
            value={item.notas}
            onChange={(e) => setItem({ ...item, notas: e.target.value })}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit">{item.id ? 'Guardar cambios' : 'Agregar artículo'}</button>
            {item.id && (
              <button
                type="button"
                className="secondary"
                onClick={() => setItem({ id: null, nombre: '', categoria: 'Pelotas', cantidad: 1, estado: 'bueno', notas: '' })}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>

        {inventario.length > 0 && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th>Cant.</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {inventario.map((i) => (
                  <tr key={i.id}>
                    <td>{i.nombre} <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>({i.categoria})</span></td>
                    <td>{i.cantidad}</td>
                    <td>{i.estado}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="secondary" onClick={() => editarItem(i)}>Editar</button>
                      <button type="button" className="secondary" onClick={() => borrarItem(i.id)}>Borrar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
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

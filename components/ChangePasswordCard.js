'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ChangePasswordCard() {
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function cambiar(e) {
    e.preventDefault();
    setMensaje('');
    if (nueva.length < 6) {
      setMensaje('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (nueva !== confirmar) {
      setMensaje('Las contraseñas no coinciden.');
      return;
    }
    setGuardando(true);
    const { error } = await supabase.auth.updateUser({ password: nueva });
    setGuardando(false);
    if (error) {
      setMensaje('No se pudo cambiar la contraseña. Intenta de nuevo.');
    } else {
      setMensaje('Contraseña actualizada.');
      setNueva('');
      setConfirmar('');
    }
  }

  return (
    <div className="card no-print" style={{ marginBottom: '1.5rem' }}>
      <p style={{ fontWeight: 500, marginTop: 0, marginBottom: 12 }}>Cambiar contraseña</p>
      {mensaje && <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 0 }}>{mensaje}</p>}
      <form onSubmit={cambiar} style={{ display: 'grid', gap: 10, maxWidth: 320 }}>
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          required
        />
        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Cambiar contraseña'}
        </button>
      </form>
    </div>
  );
}

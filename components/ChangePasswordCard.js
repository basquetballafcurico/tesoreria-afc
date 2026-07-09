'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ChangePasswordCard() {
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [tipo, setTipo] = useState('success');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(() => setMensaje(''), 4000);
    return () => clearTimeout(t);
  }, [mensaje]);

  async function cambiar(e) {
    e.preventDefault();
    setMensaje('');
    if (nueva.length < 6) {
      setMensaje('La contraseña debe tener al menos 6 caracteres.');
      setTipo('error');
      return;
    }
    if (nueva !== confirmar) {
      setMensaje('Las contraseñas no coinciden.');
      setTipo('error');
      return;
    }
    setGuardando(true);
    const { error } = await supabase.auth.updateUser({ password: nueva });
    setGuardando(false);
    if (error) {
      setMensaje('No se pudo cambiar la contraseña. Intenta de nuevo.');
      setTipo('error');
    } else {
      setMensaje('Contraseña actualizada correctamente.');
      setTipo('success');
      setNueva('');
      setConfirmar('');
    }
  }

  return (
    <div className="card no-print" style={{ marginBottom: '1.5rem' }}>
      <p style={{ fontWeight: 500, marginTop: 0, marginBottom: 12 }}>Cambiar contraseña</p>
      {mensaje && (
        <div
          style={{
            marginBottom: 12,
            padding: '0.6rem 0.8rem',
            borderRadius: 8,
            background: tipo === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: tipo === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          {tipo === 'success' ? '✓ ' : '⚠ '}{mensaje}
        </div>
      )}
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

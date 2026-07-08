'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('Correo o contraseña incorrectos.');
      return;
    }
    router.push('/dashboard');
  }

  return (
    <div className="container" style={{ maxWidth: 380, paddingTop: '4rem' }}>
      <div className="card">
        <img
          src="/logo-af.png"
          alt="Logo Alianza Francesa Basket"
          style={{ width: 72, height: 72, display: 'block', margin: '0 auto 12px' }}
        />
        <p style={{ fontWeight: 600, marginBottom: 4, textAlign: 'center' }}>Club Alianza Francesa</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 0, marginBottom: 20, textAlign: 'center' }}>
          Tesorería básquetbol
        </p>
        <form onSubmit={handleLogin}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Correo</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', marginTop: 4, marginBottom: 12 }}
          />
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', marginTop: 4, marginBottom: 16 }}
          />
          {error && <p style={{ color: 'var(--danger-text)', fontSize: 13 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

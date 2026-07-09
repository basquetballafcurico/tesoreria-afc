import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { enviarRecordatorios } from '../../../lib/enviarRecordatorios';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const enviados = await enviarRecordatorios();
    return NextResponse.json({ ok: true, enviados });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = request.headers.get('authorization');
  const token = auth?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data: { user }, error: userError } = await anon.auth.getUser(token);
  if (userError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: perfil } = await admin.from('perfiles').select('rol').eq('id', user.id).single();
  if (perfil?.rol !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    let correoPrueba = null;
    try {
      const body = await request.json();
      correoPrueba = body?.correoPrueba || null;
    } catch (e) {
      // sin cuerpo o cuerpo vacío: se manda en modo real
    }
    const enviados = await enviarRecordatorios(correoPrueba);
    return NextResponse.json({ ok: true, enviados });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

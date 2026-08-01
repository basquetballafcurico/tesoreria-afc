import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Se activa sola cada 3 días (ver vercel.json). Solo hace una consulta
// mínima a la base de datos para que Supabase la registre como "en uso"
// y no la pause por los 7 días de inactividad del plan gratuito.
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { error } = await supabase.from('jugadores').select('id').limit(1);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, hora: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

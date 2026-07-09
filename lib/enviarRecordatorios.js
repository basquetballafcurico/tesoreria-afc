import nodemailer from 'nodemailer';
import { getSupabaseAdmin } from './supabaseAdmin';

export async function enviarRecordatorios() {
  const supabase = getSupabaseAdmin();

  const { data: cuotas, error } = await supabase
    .from('cuotas')
    .select('periodo, monto, monto_pagado, estado, jugador_id, jugadores(nombre, email)')
    .in('estado', ['pendiente', 'parcial']);

  if (error) throw new Error(error.message);

  const porJugador = {};
  (cuotas || []).forEach((c) => {
    if (!c.jugadores?.email) return;
    const key = c.jugador_id;
    if (!porJugador[key]) {
      porJugador[key] = { nombre: c.jugadores.nombre, email: c.jugadores.email, pendientes: [] };
    }
    porJugador[key].pendientes.push(c);
  });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  let enviados = 0;
  for (const key of Object.keys(porJugador)) {
    const j = porJugador[key];
    const detalle = j.pendientes
      .map((c) => {
        const debe = Number(c.monto) - Number(c.monto_pagado || 0);
        return `- ${c.periodo}: debes $${debe.toLocaleString('es-CL')}`;
      })
      .join('\n');

    await transporter.sendMail({
      from: `Tesorería Club Alianza Francesa <${process.env.GMAIL_USER}>`,
      to: j.email,
      subject: 'Recordatorio de cuota pendiente — Club Alianza Francesa',
      text:
        `Hola ${j.nombre},\n\n` +
        `Tienes las siguientes cuotas pendientes en el club:\n\n${detalle}\n\n` +
        `Si ya realizaste el pago, avisa al dirigente para que lo actualice en el sistema.\n\n` +
        `Gracias,\nTesorería Club Alianza Francesa`,
    });
    enviados++;
  }

  return enviados;
}

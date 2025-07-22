// edge-functions/notify-falta-email/index.ts
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import type { Handler } from '@netlify/functions';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configuración de nodemailer (SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT!),
  secure: process.env.SMTP_SECURE === 'true', // true si usás TLS en el puerto
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  }
});

export const handler: Handler = async (event) => {
  try {
    const { alumno_id, tipo, fecha, hora } = JSON.parse(event.body ?? '{}');
    if (!alumno_id || !tipo || !fecha || !hora) {
      return { statusCode: 400, body: 'Faltan datos requeridos' };
    }

    // Traer padres vinculados
    const { data: relaciones, error: errRel } = await supabase
      .from('alumno_padre')
      .select('usuario_id')
      .eq('alumno_id', alumno_id);

    if (errRel) throw errRel;
    if (!relaciones || relaciones.length === 0) {
      return { statusCode: 200, body: 'No hay padres vinculados' };
    }

    // Traer datos del alumno
    const { data: alumno, error: errAl } = await supabase
      .from('alumnos')
      .select('nombre,apellido')
      .eq('id', alumno_id)
      .single();

    if (errAl || !alumno) throw errAl ?? new Error('Alumno no encontrado');

    // Enviar email a cada padre
    for (const { usuario_id } of relaciones) {
      const { data: padre, error: errPadre } = await supabase
        .from('usuarios')
        .select('nombre,email')
        .eq('id', usuario_id)
        .single();

      if (errPadre || !padre) {
        console.warn('Padre no encontrado o error:', usuario_id);
        continue;
      }

      const link = `${process.env.SITE_URL}/justificar?aid=${alumno_id}&fecha=${fecha}`;

      const mailBody = `
        <p>Hola ${padre.nombre},</p>
        <p>El alumno <strong>${alumno.nombre} ${alumno.apellido}</strong> registró una <strong>${tipo}</strong> el día ${fecha} a las ${hora}.</p>
        <p>Si corresponde, podés <a href="${link}">justificar esta ausencia</a>.</p>
        <hr/>
        <p>No respondas este correo.</p>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_FROM!,
        to: padre.email,
        subject: `🚨 ${tipo.toUpperCase()} de ${alumno.nombre}`,
        html: mailBody
      });
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch (err: any) {
    console.error('Error en notify-falta-email:', err);
    return { statusCode: 500, body: err.message };
  }
};

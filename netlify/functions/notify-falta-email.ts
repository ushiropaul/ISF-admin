import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export const handler: Handler = async (event, context) => {
  const { alumno_id, tipo, fecha, hora } = JSON.parse(event.body || '{}');

  // buscar padres vinculados
  const { data: relaciones } = await supabase
    .from('alumno_padre')
    .select('usuario_id')
    .eq('alumno_id', alumno_id);

  // enviar email con nodemailer o servicio email
  // ...

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};

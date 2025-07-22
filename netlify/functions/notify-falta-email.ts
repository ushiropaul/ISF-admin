import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  try {
    const { email, nombreAlumno, fechaFalta, hora } = JSON.parse(event.body || '{}');

    if (!email || !nombreAlumno || !fechaFalta) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Faltan datos: email, nombreAlumno o fechaFalta' }),
      };
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'No se encontró la API Key de Brevo en las variables de entorno' }),
      };
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      } as HeadersInit, // 👈 Esto soluciona el error de tipado
      body: JSON.stringify({
        sender: { name: 'ISF Administración', email: 'secretsecisf@gmail.com' },
        to: [{ email }],
        subject: 'Falta registrada',
        htmlContent: `
          <h1>Hola</h1>
          <p>El alumno <strong>${nombreAlumno}</strong> ha faltado el día <strong>${fechaFalta}</strong> a las <strong>${hora}</strong>.</p>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Error al enviar el correo', detalles: errorData }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ mensaje: 'Correo enviado exitosamente' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno del servidor', detalles: err }),
    };
  }
};

export { handler };

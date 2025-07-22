import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';

export default function Faltas() {
  const [cursos, setCursos] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [form, setForm] = useState({
    cursoId: '',
    alumnoId: '',
    fecha: new Date().toISOString().slice(0, 10),
    hora: new Date().toTimeString().slice(0, 5),
    tipo: 'falta'
  });
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    supabase.from('cursos').select('id,nombre').then(({ data }) => setCursos(data || []));
  }, []);

  useEffect(() => {
    if (!form.cursoId) return;
    supabase
      .from('alumnos')
      .select('id,nombre,apellido')
      .eq('curso_id', form.cursoId)
      .then(({ data }) => setAlumnos(data || []));
  }, [form.cursoId]);

  const registrar = async () => {
    const { data: existing } = await supabase
      .from('asistencias')
      .select('id')
      .eq('alumno_id', form.alumnoId)
      .eq('fecha', form.fecha)
      .eq('tipo', form.tipo);

    if (existing.length) {
      setMensaje('Ya existe ese registro.');
      return;
    }

    const { data, error } = await supabase
      .from('asistencias')
      .insert([{
        alumno_id: form.alumnoId,
        fecha: form.fecha,
        hora: form.hora,
        tipo: form.tipo
      }])
      .select('id,alumno_id,fecha,hora,tipo')
      .single();

    if (error || !data) {
      setMensaje('Error: ' + error.message);
      return;
    }

    // Enviar email al padre
    try {
      await fetch('/.netlify/functions/notify-falta-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setMensaje('Registro exitoso y email enviado al padre.');
    } catch (e) {
      setMensaje('Registrado, pero error al enviar email.');
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Gestionar Faltas / Llegadas Tarde</h2>

      <label>Curso:
        <select value={form.cursoId} onChange={e => setForm({ ...form, cursoId: e.target.value, alumnoId: '' })}>
          <option value="">Seleccionar curso</option>
          {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </label>

      <label>Alumno:
        <select value={form.alumnoId} onChange={e => setForm({ ...form, alumnoId: e.target.value })}>
          <option value="">Seleccionar alumno</option>
          {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre} {a.apellido}</option>)}
        </select>
      </label>

      <label>Fecha:
        <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })}/>
      </label>

      <label>Hora:
        <input type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })}/>
      </label>

      <label>Tipo:
        <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
          <option value="falta">Falta</option>
          <option value="llegada_tarde">Llegada Tarde</option>
        </select>
      </label>

      <button disabled={!form.cursoId || !form.alumnoId} onClick={registrar}>Registrar</button>
      {mensaje && <p>{mensaje}</p>}
    </div>
  );
}

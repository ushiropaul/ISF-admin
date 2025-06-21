import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';

export default function Faltas() {
  const [alumnos, setAlumnos] = useState([]);
  const [form, setForm] = useState({ fecha: '', tipo: 'falta', cursoId: '' });
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    async function fetchAlumnos() {
      if (!form.cursoId) return;
      const { data } = await supabase
        .from('alumnos')
        .select('id,nombre,apellido')
        .eq('curso_id', form.cursoId);
      setAlumnos(data || []);
    }
    fetchAlumnos();
  }, [form.cursoId]);

  const registrarFalta = async (alumno_id) => {
    const { data: existing } = await supabase
      .from('asistencias')
      .select('id')
      .eq('alumno_id', alumno_id)
      .eq('fecha', form.fecha)
      .eq('tipo', form.tipo);

    if (existing?.length) return setMensaje('Ya existe el registro.');

    const { error } = await supabase.from('asistencias').insert([{
      alumno_id, fecha: form.fecha, tipo: form.tipo
    }]);
    setMensaje(error ? 'Error: ' + error.message : 'Registrado.');
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Gestión de Faltas / Llegadas Tarde</h2>
      <label>Curso ID: 
        <input type="number" value={form.cursoId} onChange={e => setForm({...form, cursoId: e.target.value})}/>
      </label>
      <label>Fecha: 
        <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}/>
      </label>
      <label>Tipo: 
        <select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>
          <option value="falta">Falta</option>
          <option value="llegada_tarde">Llegada tarde</option>
        </select>
      </label>
      <ul>
        {alumnos.map(a => (
          <li key={a.id}>
            {a.nombre} {a.apellido} 
            <button onClick={()=>registrarFalta(a.id)}>Marcar {form.tipo}</button>
          </li>
        ))}
      </ul>
      {mensaje && <p>{mensaje}</p>}
    </div>
  );
}

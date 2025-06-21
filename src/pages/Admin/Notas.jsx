// src/pages/Nota/Nota.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useNavigate } from 'react-router-dom';

export default function Nota() {
  const [cursoMaterias, setCursoMaterias] = useState([]);
  const [form, setForm] = useState({
    cm_id: '',
    fecha: '',
    tipoEval: '',
    titulo: '',
    cuatrimestre: 1
  });
  const [alumnos, setAlumnos] = useState([]);
  const [indice, setIndice] = useState(0);
  const [valorNota, setValorNota] = useState('');
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from('curso_materia')
      .select('id, materias(nombre), cursos(id,nombre)')
      .then(({ data }) => setCursoMaterias(data || []));
  }, []);

  const iniciar = async () => {
    if (![form.cm_id, form.fecha, form.tipoEval, form.titulo].every(Boolean)) {
      setMensaje('Completa todos los campos.');
      return;
    }
    setMensaje('');
    const cm = cursoMaterias.find(c => c.id === Number(form.cm_id));
    const cursoId = cm.cursos.id;
    const { data } = await supabase
      .from('alumnos')
      .select('id,nombre,apellido')
      .eq('curso_id', cursoId);
    setAlumnos(data || []);
    setIndice(0);
  };

  const registrar = async (e) => {
    e.preventDefault();
    const alumno = alumnos[indice];
    const { data: faltas } = await supabase
      .from('asistencias')
      .select('id')
      .eq('alumno_id', alumno.id)
      .eq('fecha', form.fecha)
      .eq('tipo', 'falta');

    if (!valorNota && faltas.length) {
      alert(`${alumno.nombre} ya tiene falta.`);
      siguiente();
      return;
    }

    if (valorNota) {
      await supabase.from('notas').insert([{ alumno_id: alumno.id, curso_materia_id: form.cm_id, calificacion: valorNota, fecha: form.fecha, cuatrimestre: form.cuatrimestre }]);
      if (faltas.length) {
        await supabase.from('asistencias').delete().eq('alumno_id', alumno.id).eq('fecha', form.fecha).eq('tipo', 'falta');
      }
    } else {
      if (!faltas.length) {
        await supabase.from('asistencias').insert([{ alumno_id: alumno.id, fecha: form.fecha, hora: new Date().toTimeString().slice(0,5), tipo: 'falta' }]);
      }
    }
    siguiente();
  };

  const siguiente = () => {
    setValorNota('');
    setIndice(i => i + 1);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Evaluaciones y Notas</h2>
      {indice === 0 && alumnos.length === 0 ? (
        <>
          <select value={form.cm_id} onChange={e => setForm({ ...form, cm_id: e.target.value })}>
            <option value="">Curso–Materia</option>
            {cursoMaterias.map(cm => (
              <option key={cm.id} value={cm.id}>
                {cm.cursos.nombre} – {cm.materias.nombre}
              </option>
            ))}
          </select>
          <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })}/>
          <select value={form.tipoEval} onChange={e => setForm({ ...form, tipoEval: e.target.value })}>
            <option value="">Tipo</option>
            <option value="evaluacion">Evaluación</option>
            <option value="trabajo">Trabajo</option>
            <option value="exposicion">Exposición</option>
          </select>
          <input type="text" placeholder="Título" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}/>
          <select value={form.cuatrimestre} onChange={e => setForm({ ...form, cuatrimestre: Number(e.target.value) })}>
            <option value={1}>1° Cuatrimestre</option>
            <option value={2}>2° Cuatrimestre</option>
          </select>
          <button onClick={iniciar}>Iniciar</button>
          {mensaje && <p style={{ color: 'red' }}>{mensaje}</p>}
        </>
      ) : alumnos.length > 0 && indice < alumnos.length ? (
        <form onSubmit={registrar}>
          <h3>{alumnos[indice].nombre} {alumnos[indice].apellido}</h3>
          <input
            type="number"
            placeholder="Nota (vacío = falta)"
            value={valorNota}
            onChange={e => setValorNota(e.target.value)}
          />
          <button type="submit">Guardar y siguiente</button>
        </form>
      ) : (
        <div>
          <p>✅ Registro completado.</p>
          <button onClick={() => navigate('/panel')}>Volver al Panel</button>
        </div>
      )}
    </div>
  );
}

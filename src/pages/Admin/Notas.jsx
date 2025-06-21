import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useNavigate } from 'react-router-dom';

export default function Nota() {
  const [cursoMaterias, setCursoMaterias] = useState([]);
  const [form, setForm] = useState({
    cm_id: '',
    fecha: '',
    cuatrimestre: 1,
    titulo: ''
  });
  const [alumnos, setAlumnos] = useState([]);
  const [indice, setIndice] = useState(0);
  const [valorNota, setValorNota] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCursoMaterias() {
      const { data, error } = await supabase
        .from('curso_materia')
        .select('id, cursos(id, nombre), materias(nombre)')
        .order('id');
      if (error) console.error(error);
      else setCursoMaterias(data || []);
    }
    fetchCursoMaterias();
  }, []);

  async function iniciar() {
    if (!form.cm_id || !form.fecha || !form.titulo) {
      setMensaje('Completa curso, fecha y título');
      return;
    }
    setMensaje('');
    const cm = cursoMaterias.find(c => c.id === Number(form.cm_id));
    const cursoId = cm?.cursos?.id;
    const { data, error } = await supabase
      .from('alumnos')
      .select('id, nombre, apellido')
      .eq('curso_id', cursoId);
    if (error) return console.error(error);
    setAlumnos(data || []);
    setIndice(0);
  }

  async function registrarParaAlumno(e) {
    e.preventDefault();
    if (registrando) return;
    setRegistrando(true);

    const alumno = alumnos[indice];
    const { data: faltas } = await supabase
      .from('asistencias')
      .select('id')
      .eq('alumno_id', alumno.id)
      .eq('fecha', form.fecha)
      .eq('tipo', 'falta');

    if (!valorNota && faltas?.length > 0) {
      alert(`${alumno.nombre} ya tiene falta registrada.`);
      avanzar();
      setRegistrando(false);
      return;
    }

    if (valorNota) {
      await supabase.from('notas').insert([{
        alumno_id: alumno.id,
        curso_materia_id: form.cm_id,
        calificacion: valorNota,
        fecha: form.fecha,
        cuatrimestre: form.cuatrimestre
      }]);
      if (faltas?.length > 0) {
        await supabase.from('asistencias')
          .delete()
          .eq('alumno_id', alumno.id)
          .eq('fecha', form.fecha)
          .eq('tipo', 'falta');
      }
    } else {
      if (faltas?.length === 0) {
        await supabase.from('asistencias').insert([{
          alumno_id: alumno.id,
          fecha: form.fecha,
          hora: new Date().toTimeString().slice(0,5),
          tipo: 'falta'
        }]);
      }
    }

    avanzar();
    setRegistrando(false);
  }

  function avanzar() {
    setValorNota('');
    setIndice(i => i + 1);
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Notas & Faltas</h2>

      {indice === 0 && alumnos.length === 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <select
            value={form.cm_id}
            onChange={e => setForm({ ...form, cm_id: e.target.value })}
          >
            <option value=''>Seleccioná Curso–Materia</option>
            {cursoMaterias.map(cm => (
              <option key={cm.id} value={cm.id}>
                {cm.cursos.nombre} – {cm.materias.nombre}
              </option>
            ))}
          </select><br/>

          <input
            type="date"
            value={form.fecha}
            onChange={e => setForm({ ...form, fecha: e.target.value })}
          /><br/>

          <input
            type="text"
            placeholder="Título de la prueba o trabajo"
            value={form.titulo}
            onChange={e => setForm({ ...form, titulo: e.target.value })}
          /><br/>

          <select
            value={form.cuatrimestre}
            onChange={e => setForm({ ...form, cuatrimestre: Number(e.target.value) })}
          >
            <option value={1}>1° Cuatrimestre</option>
            <option value={2}>2° Cuatrimestre</option>
          </select><br/>

          <button onClick={iniciar}>Iniciar</button>
          {mensaje && <p style={{ color: 'red' }}>{mensaje}</p>}
        </div>
      )}

      {indice < alumnos.length && (
        <form onSubmit={registrarParaAlumno}>
          <h3>{alumnos[indice].nombre} {alumnos[indice].apellido}</h3>
          <input
            type="number"
            placeholder="Nota (vacío = falta)"
            value={valorNota}
            onChange={e => setValorNota(e.target.value)}
          /><br/>
          <button type="submit" disabled={registrando}>Guardar y seguir</button>
        </form>
      )}

      {alumnos.length > 0 && indice >= alumnos.length && (
        <div>
          <p>✅ Registro completado.</p>
          <button onClick={() => navigate('/panel')}>Volver al panel</button>
        </div>
      )}
    </div>
  );
}

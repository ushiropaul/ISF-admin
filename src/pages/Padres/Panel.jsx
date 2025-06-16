import { useEffect, useState } from 'react';
import { supabase } from './../../supabaseClient.js';

export default function Panel() {
  const [usuarioId, setUsuarioId] = useState(null);
  const [relaciones, setRelaciones] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    documento: '',
    fecha_nacimiento: ''
  });
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const obtenerDatos = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const idUsuario = authData?.user?.id;
      if (!idUsuario) return;

      setUsuarioId(idUsuario);
      await cargarRelaciones(idUsuario);
    };
    obtenerDatos();
  }, []);

  const cargarRelaciones = async (idUsuario) => {
    const { data: relaciones, error } = await supabase
      .from('alumno_padre')
      .select(`
        id,
        alumno_id,
        usuario_id,
        alumnos (
          id,
          nombre,
          apellido,
          curso_id,
          notas (
            id,
            calificacion,
            fecha,
            cuatrimestre,
            curso_materia (
              id,
              materias (
                nombre
              )
            )
          ),
          asistencias (
            id,
            fecha,
            hora,
            tipo
          )
        )
      `)
      .eq('usuario_id', idUsuario);

    if (error) {
      console.error('Error al cargar relaciones:', error.message);
    } else {
      console.log('Relaciones cargadas:', relaciones);
      setRelaciones(relaciones || []);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const verificarYRelacionar = async (e) => {
    e.preventDefault();
    setMensaje('Verificando datos...');

    const { data: alumnoEncontrado, error } = await supabase
      .from('alumnos')
      .select('*')
      .match({
        nombre: form.nombre,
        apellido: form.apellido,
        documento: form.documento,
        fecha_nacimiento: form.fecha_nacimiento
      })
      .maybeSingle();

    if (error || !alumnoEncontrado) {
      setMensaje('Alumno no encontrado.');
      return;
    }

    const { data: yaRelacionado } = await supabase
      .from('alumno_padre')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('alumno_id', alumnoEncontrado.id)
      .maybeSingle();

    if (yaRelacionado) {
      setMensaje('Ya estás vinculado a este alumno.');
      return;
    }

    const { error: relacionError } = await supabase
      .from('alumno_padre')
      .insert({ alumno_id: alumnoEncontrado.id, usuario_id: usuarioId });

    if (relacionError) {
      setMensaje('Error al guardar la relación.');
      return;
    }

    await cargarRelaciones(usuarioId);
    setMensaje('Relación creada correctamente.');
    setForm({ nombre: '', apellido: '', documento: '', fecha_nacimiento: '' });
  };

  const desvincular = async (idRelacion) => {
    const { error } = await supabase
      .from('alumno_padre')
      .delete()
      .eq('id', idRelacion);

    if (!error) {
      setRelaciones(relaciones.filter((rel) => rel.id !== idRelacion));
    } else {
      setMensaje('Error al eliminar la relación.');
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Panel de Padres</h2>

      <h3>Mis hijos vinculados:</h3>
      {relaciones.length === 0 ? (
        <p>No tienes hijos vinculados.</p>
      ) : (
        relaciones.map((rel) => (
          <div key={rel.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
            <h4>Datos del alumno:</h4>
            <ul>
              {Object.entries(rel.alumnos).map(([key, value]) => (
                key !== 'notas' && key !== 'asistencias' && (
                  <li key={key}><strong>{key.replace(/_/g, ' ')}:</strong> {String(value)}</li>
                )
              ))}
            </ul>

            <h4>Notas:</h4>
            {rel.alumnos.notas && rel.alumnos.notas.length > 0 ? (
              <ul>
                {rel.alumnos.notas.map((nota) => (
                  <li key={nota.id}>
                    {nota.curso_materia?.materia?.nombre || 'Sin materia'} - {nota.calificacion} - Cuatrimestre {nota.cuatrimestre} - {nota.fecha}
                  </li>
                ))}
              </ul>
            ) : <p>Sin notas registradas.</p>}

            <h4>Asistencias:</h4>
            {rel.alumnos.asistencias && rel.alumnos.asistencias.length > 0 ? (
              <ul>
                {rel.alumnos.asistencias.map((asis) => (
                  <li key={asis.id}>
                    {asis.tipo} - {asis.fecha} - {asis.hora}
                  </li>
                ))}
              </ul>
            ) : <p>Sin asistencias registradas.</p>}

            <button onClick={() => desvincular(rel.id)} style={{ marginTop: '1rem' }}>Desvincular</button>
          </div>
        ))
      )}

      <hr />

      <h3>Vincular un nuevo hijo</h3>
      <form onSubmit={verificarYRelacionar} style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <input type="text" name="nombre" placeholder="Nombre del alumno" value={form.nombre} onChange={handleChange} required />
        <input type="text" name="apellido" placeholder="Apellido del alumno" value={form.apellido} onChange={handleChange} required />
        <input type="text" name="documento" placeholder="Documento" value={form.documento} onChange={handleChange} required />
        <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} required />
        <button type="submit">Vincular</button>
      </form>
      {mensaje && <p>{mensaje}</p>}
    </div>
  );
}

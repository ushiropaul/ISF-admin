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

  function procesarNotas(notas) {
    const ordenadas = [...notas].sort((a, b) => {
      const matA = a.curso_materia.materias.nombre;
      const matB = b.curso_materia.materias.nombre;
      if (matA !== matB) return matA.localeCompare(matB);
      if (a.cuatrimestre !== b.cuatrimestre) return a.cuatrimestre - b.cuatrimestre;
      return new Date(a.fecha) - new Date(b.fecha);
    });

    const cuatri = {};
    ordenadas.forEach(n => {
      const clave = `${n.cuatrimestre}-${n.fecha.slice(0, 4)}`;
      if (!cuatri[clave]) cuatri[clave] = [];
      cuatri[clave].push(n.calificacion);
    });

    const promediosCuat = Object.entries(cuatri).map(([clave, arr]) => ({
      cuatrimestre: clave.split('-')[0],
      año: clave.split('-')[1],
      promedio: (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)
    }));

    const promedioGeneral = (ordenadas.reduce((a, n) => a + parseFloat(n.calificacion), 0) / ordenadas.length).toFixed(2);

    return { ordenadas, promediosCuat, promedioGeneral };
  }

  const cargarRelaciones = async (idUsuario) => {
    const { data: relaciones, error } = await supabase
      .from('alumno_padre')
      .select(`
        id,
        alumno_id,
        usuario_id,
        alumnos (
          nombre,
          apellido,
          documento,
          fecha_nacimiento,
          grupo_sanguineo,
          nacionalidad,
          edad,
          num_cel,
          localidad,
          domicilio,
          cursos (nombre),
          notas!notas_alumno_id_fkey (
            id,
            calificacion,
            fecha,
            cuatrimestre,
            curso_materia!notas_curso_materia_id_fkey (
              materias (nombre)
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
              {['nombre', 'apellido', 'documento', 'fecha_nacimiento', 'grupo_sanguineo', 'nacionalidad', 'edad', 'num_cel', 'localidad', 'domicilio']
                .map(k => (
                  <li key={k}><strong>{k.replace(/_/g, ' ')}:</strong> {rel.alumnos[k]}</li>
              ))}
              <li><strong>Curso:</strong> {rel.alumnos.cursos?.nombre || 'Sin curso asignado'}</li>
            </ul>

            <h4>Notas:</h4>
            {rel.alumnos.notas && rel.alumnos.notas.length > 0 ? (() => {
              const { ordenadas, promediosCuat, promedioGeneral } = procesarNotas(rel.alumnos.notas);
              return (
                <>
                  <ul>
                    {ordenadas.map(nota => (
                      <li key={nota.id}>
                        {nota.curso_materia?.materias?.nombre || 'Sin materia'} — Cuatrimestre {nota.cuatrimestre}, {nota.fecha}: {nota.calificacion}
                      </li>
                    ))}
                  </ul>
                  <p><strong>Promedios por cuatrimestre:</strong></p>
                  <ul>
                    {promediosCuat.map(p => (
                      <li key={p.cuatrimestre + '-' + p.año}>
                        Cuatrimestre {p.cuatrimestre} {p.año}: {p.promedio}
                      </li>
                    ))}
                  </ul>
                  <p><strong>Promedio general:</strong> {promedioGeneral}</p>
                </>
              );
            })() : <p>Sin notas registradas.</p>}

            <h4>Faltas y llegadas tarde:</h4>
            {rel.alumnos.asistencias && rel.alumnos.asistencias.length > 0 ? (
              <ul>
                {rel.alumnos.asistencias.map(asis => (
                  <li key={asis.id}>
                    {asis.tipo.replace('_', ' ')} — {asis.fecha} a las {asis.hora}
                  </li>
                ))}
              </ul>
            ) : <p>Sin faltas ni llegadas tarde registradas.</p>}

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

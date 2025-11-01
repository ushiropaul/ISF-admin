import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './../../styles/Alumnos.css'


const Alumnos = () => {
  // Estados para alumnos, cursos y formulario
  const [alumnos, setAlumnos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [aniosEscolares, setAniosEscolares] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    documento: '',
    fecha_nacimiento: '',
    grupo_sanguineo: '',
    nacionalidad: '',
    edad: '',
    num_cel: '',
    localidad: '',
    domicilio: '',
    curso_id: ''
  });
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState({
    curso_id: '',
    anio_escolar_id: '',
    edadMin: '',
    edadMax: ''
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [error, setError] = useState(null);

  // Carga inicial de datos
  useEffect(() => {
    obtenerAlumnos();
    obtenerCursos();
  }, []);

  // Obtener alumnos con curso asociado
  const obtenerAlumnos = async () => {
    const { data, error } = await supabase
      .from('alumnos')
      .select(`*, cursos(nombre)`)
      .order('id', { ascending: true });
    if (error) {
      console.error('Error al obtener alumnos:', error);
    } else {
      setAlumnos(data);
    }
  };

  // Obtener cursos para select
const obtenerCursos = async () => {
  const { data: cursosData, error: cursosError } = await supabase
    .from('cursos')
    .select('*, anios_escolares(id, anio, turno)');

  if (cursosError) {
    console.error('Error al obtener cursos:', cursosError);
  } else {
    setCursos(cursosData);

    const anios = cursosData
      .map((c) => c.anios_escolares)
      .filter(
        (v, i, a) => v && a.findIndex((t) => t.id === v.id) === i
      );

    setAniosEscolares(anios);
  }
};


  // Manejo de inputs (actualiza el form)
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Para edad, convertir a número si no está vacío
    if (name === 'edad') {
      setForm({
        ...form,
        [name]: value === '' ? '' : Number(value),
      });
    } else {
      setForm({
        ...form,
        [name]: value,
      });
    }
  };

  // Validación simple (se puede ampliar)
  const validarFormulario = () => {
    if (!form.nombre.trim() || !form.apellido.trim() || !form.documento.trim()) {
      setError('Nombre, Apellido y Documento son obligatorios');
      return false;
    }
    if (!form.curso_id) {
      setError('Debe seleccionar un curso');
      return false;
    }
    setError(null);
    return true;
  };

  // Agregar alumno
  const agregarAlumno = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    const { data, error } = await supabase.from('alumnos').insert([
      {
        nombre: form.nombre,
        apellido: form.apellido,
        documento: form.documento,
        fecha_nacimiento: form.fecha_nacimiento || null,
        grupo_sanguineo: form.grupo_sanguineo || null,
        nacionalidad: form.nacionalidad || null,
        edad: form.edad || null,
        num_cel: form.num_cel || null,
        localidad: form.localidad || null,
        domicilio: form.domicilio || null,
        curso_id: form.curso_id
      }
    ]);
    if (error) {
      setError('Error al agregar alumno: ' + error.message);
      return;
    }
    setForm({
      nombre: '',
      apellido: '',
      documento: '',
      fecha_nacimiento: '',
      grupo_sanguineo: '',
      nacionalidad: '',
      edad: '',
      num_cel: '',
      localidad: '',
      domicilio: '',
      curso_id: ''
    });
    obtenerAlumnos();
  };

  // Preparar edición (carga datos en formulario)
  const prepararEdicion = (alumno) => {
    setForm({
      nombre: alumno.nombre || '',
      apellido: alumno.apellido || '',
      documento: alumno.documento || '',
      fecha_nacimiento: alumno.fecha_nacimiento || '',
      grupo_sanguineo: alumno.grupo_sanguineo || '',
      nacionalidad: alumno.nacionalidad || '',
      edad: alumno.edad || '',
      num_cel: alumno.num_cel || '',
      localidad: alumno.localidad || '',
      domicilio: alumno.domicilio || '',
      curso_id: alumno.curso_id || ''
    });
    setIdEditando(alumno.id);
    setModoEdicion(true);
    setError(null);
  };

  // Actualizar alumno
  const actualizarAlumno = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    const { data, error } = await supabase
      .from('alumnos')
      .update({
        nombre: form.nombre,
        apellido: form.apellido,
        documento: form.documento,
        fecha_nacimiento: form.fecha_nacimiento || null,
        grupo_sanguineo: form.grupo_sanguineo || null,
        nacionalidad: form.nacionalidad || null,
        edad: form.edad || null,
        num_cel: form.num_cel || null,
        localidad: form.localidad || null,
        domicilio: form.domicilio || null,
        curso_id: form.curso_id
      })
      .eq('id', idEditando);

    if (error) {
      setError('Error al actualizar alumno: ' + error.message);
      return;
    }
    setForm({
      nombre: '',
      apellido: '',
      documento: '',
      fecha_nacimiento: '',
      grupo_sanguineo: '',
      nacionalidad: '',
      edad: '',
      num_cel: '',
      localidad: '',
      domicilio: '',
      curso_id: ''
    });
    setModoEdicion(false);
    setIdEditando(null);
    obtenerAlumnos();
  };

  // Eliminar alumno
  const eliminarAlumno = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este alumno?')) return;

    const { error } = await supabase.from('alumnos').delete().eq('id', id);
    if (error) {
      alert('Error al eliminar alumno: ' + error.message);
    } else {
      obtenerAlumnos();
    }
  };

  const alumnosFiltrados = alumnos.filter((alumno) => {
  const coincideBusqueda = Object.values(alumno).some((valor) =>
    valor && valor.toString().toLowerCase().includes(busqueda.toLowerCase())
  );

  const coincideCurso =
    !filtros.curso_id || alumno.curso_id === parseInt(filtros.curso_id);

  const coincideAnio =
    !filtros.anio_escolar_id ||
    cursos.find(c => c.id === alumno.curso_id)?.anio_escolar_id === parseInt(filtros.anio_escolar_id);

  const edad = alumno.edad || 0;
  const coincideEdadMin =
    !filtros.edadMin || edad >= parseInt(filtros.edadMin);
  const coincideEdadMax =
    !filtros.edadMax || edad <= parseInt(filtros.edadMax);

    return (
        coincideBusqueda &&
        coincideCurso &&
        coincideAnio &&
        coincideEdadMin &&
        coincideEdadMax
    );
    });


  return (
    <div className='divprincipal'>
      <h2>Gestión de Alumnos</h2>

      <form onSubmit={modoEdicion ? actualizarAlumno : agregarAlumno}>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="apellido"
          placeholder="Apellido"
          value={form.apellido}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="documento"
          placeholder="Documento"
          value={form.documento}
          onChange={handleChange}
          required
        />

        <input
          type="date"
          name="fecha_nacimiento"
          placeholder="Fecha de Nacimiento"
          value={form.fecha_nacimiento}
          onChange={handleChange}
        />

        <input
          type="text"
          name="grupo_sanguineo"
          placeholder="Grupo Sanguíneo"
          value={form.grupo_sanguineo}
          onChange={handleChange}
        />

        <input
          type="text"
          name="nacionalidad"
          placeholder="Nacionalidad"
          value={form.nacionalidad}
          onChange={handleChange}
        />

        <input
          type="number"
          name="edad"
          placeholder="Edad"
          value={form.edad}
          onChange={handleChange}
          min="0"
        />

        <input
          type="text"
          name="num_cel"
          placeholder="Número de Celular"
          value={form.num_cel}
          onChange={handleChange}
        />

        <input
          type="text"
          name="localidad"
          placeholder="Localidad"
          value={form.localidad}
          onChange={handleChange}
        />

        <input
          type="text"
          name="domicilio"
          placeholder="Domicilio"
          value={form.domicilio}
          onChange={handleChange}
        />

        <select
          name="curso_id"
          value={form.curso_id}
          onChange={handleChange}
          required
        >
          <option value="" disabled>
            Seleccione un curso
          </option>
          {cursos.map((curso) => (
            <option key={curso.id} value={curso.id}>
              {curso.nombre}
            </option>
          ))}
        </select>

        <button type="submit">{modoEdicion ? 'Actualizar' : 'Agregar'}</button>
        {modoEdicion && (
          <button
            type="button"
            onClick={() => {
              setModoEdicion(false);
              setForm({
                nombre: '',
                apellido: '',
                documento: '',
                fecha_nacimiento: '',
                grupo_sanguineo: '',
                nacionalidad: '',
                edad: '',
                num_cel: '',
                localidad: '',
                domicilio: '',
                curso_id: ''
              });
              setIdEditando(null);
              setError(null);
            }}
          >
            Cancelar
          </button>
        )}
      </form>

      <hr />

            <h4>Buscar y filtrar</h4>
        <input
        type="text"
        placeholder="Buscar por cualquier campo"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ marginBottom: '1rem', width: '100%', padding: '0.5rem' }}
        />

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <select
            value={filtros.curso_id}
            onChange={(e) => setFiltros({ ...filtros, curso_id: e.target.value })}
        >
            <option value="">Todos los cursos</option>
            {cursos.map((curso) => (
            <option key={curso.id} value={curso.id}>{curso.nombre}</option>
            ))}
        </select>

        <select
            value={filtros.anio_escolar_id}
            onChange={(e) => setFiltros({ ...filtros, anio_escolar_id: e.target.value })}
        >
            <option value="">Todos los años</option>
            {aniosEscolares.map((a) => (
            <option key={a.id} value={a.id}>
                {a.anio} - {a.turno}
            </option>
            ))}
        </select>

        <input
            type="number"
            placeholder="Edad mínima"
            value={filtros.edadMin}
            onChange={(e) => setFiltros({ ...filtros, edadMin: e.target.value })}
        />

        <input
            type="number"
            placeholder="Edad máxima"
            value={filtros.edadMax}
            onChange={(e) => setFiltros({ ...filtros, edadMax: e.target.value })}
        />
        </div>


      <h3>Lista de Alumnos</h3>
      <div className='table-container'>
        <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Documento</th>
            <th>Fecha Nacimiento</th>
            <th>Grupo Sanguíneo</th>
            <th>Nacionalidad</th>
            <th>Edad</th>
            <th>Celular</th>
            <th>Localidad</th>
            <th>Domicilio</th>
            <th>Curso</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {alumnosFiltrados.map((alumno) => (
            <tr key={alumno.id}>
              <td>{alumno.nombre}</td>
              <td>{alumno.apellido}</td>
              <td>{alumno.documento}</td>
              <td>{alumno.fecha_nacimiento}</td>
              <td>{alumno.grupo_sanguineo}</td>
              <td>{alumno.nacionalidad}</td>
              <td>{alumno.edad}</td>
              <td>{alumno.num_cel}</td>
              <td>{alumno.localidad}</td>
              <td>{alumno.domicilio}</td>
              <td>{alumno.cursos?.nombre || 'Sin curso'}</td>
              <td>
                <button onClick={() => prepararEdicion(alumno)}>Editar</button>{' '}
                <button onClick={() => eliminarAlumno(alumno.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
          {alumnos.length === 0 && (
            <tr>
              <td colSpan="12" style={{ textAlign: 'center' }}>
                No hay alumnos registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default Alumnos;

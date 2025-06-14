import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';

const UserAdministrator = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    num_cel: '',
    rol: '',
  });
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 10;

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const obtenerUsuarios = async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener usuarios:', error.message);
    } else {
      setUsuarios(data);
    }
  };

  const usuariosFiltrados = usuarios.filter((usuario) =>
    Object.values(usuario).some((valor) =>
      valor?.toString().toLowerCase().includes(busqueda.toLowerCase())
    )
  );

  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);
  const usuariosPaginados = usuariosFiltrados.slice(
    (paginaActual - 1) * usuariosPorPagina,
    paginaActual * usuariosPorPagina
  );

  const cambiarPagina = (numero) => {
    setPaginaActual(numero);
  };

  const handleEditar = (usuario) => {
    setModoEdicion(true);
    setUsuarioEditando(usuario.id);
    setForm({
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      num_cel: usuario.num_cel || '',
      rol: usuario.rol || 'padre',
    });
    setExito(null);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleActualizar = async (e) => {
    e.preventDefault();

    const { error } = await supabase
      .from('usuarios')
      .update({
        nombre: form.nombre,
        apellido: form.apellido,
        num_cel: form.num_cel,
        rol: form.rol,
      })
      .eq('id', usuarioEditando);

    if (error) {
      setError('Error al actualizar: ' + error.message);
      setExito(null);
    } else {
      setError(null);
      setExito('Usuario actualizado correctamente.');
      setModoEdicion(false);
      setUsuarioEditando(null);
      setForm({
        nombre: '',
        apellido: '',
        num_cel: '',
        rol: '',
      });
      obtenerUsuarios();
    }
  };

  const handleCancelar = () => {
    setModoEdicion(false);
    setUsuarioEditando(null);
    setForm({
      nombre: '',
      apellido: '',
      num_cel: '',
      rol: '',
    });
    setError(null);
    setExito(null);
  };

  const handleEliminar = async (id) => {
    const confirmacion = window.confirm('¿Estás seguro de que querés eliminar este usuario? Esta acción no se puede deshacer.');
    if (!confirmacion) return;

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) {
      setError('Error al eliminar: ' + error.message);
      setExito(null);
    } else {
      setError(null);
      setExito('Usuario eliminado correctamente.');
      obtenerUsuarios();
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Administrar Usuarios</h2>

      <input
        type="text"
        placeholder="Buscar usuarios por cualquier campo"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
      />

      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>
      )}
      {exito && (
        <div style={{ color: 'green', marginBottom: '1rem' }}>{exito}</div>
      )}

      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Celular</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuariosPaginados.map((usuario) => (
            <tr key={usuario.id}>
              <td>{usuario.email}</td>
              <td>
                {modoEdicion && usuario.id === usuarioEditando ? (
                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                  />
                ) : (
                  usuario.nombre || '-'
                )}
              </td>
              <td>
                {modoEdicion && usuario.id === usuarioEditando ? (
                  <input
                    type="text"
                    name="apellido"
                    value={form.apellido}
                    onChange={handleChange}
                  />
                ) : (
                  usuario.apellido || '-'
                )}
              </td>
              <td>
                {modoEdicion && usuario.id === usuarioEditando ? (
                  <input
                    type="text"
                    name="num_cel"
                    value={form.num_cel}
                    onChange={handleChange}
                  />
                ) : (
                  usuario.num_cel || '-'
                )}
              </td>
              <td>
                {modoEdicion && usuario.id === usuarioEditando ? (
                  <select
                    name="rol"
                    value={form.rol}
                    onChange={handleChange}
                  >
                    <option value="admin">Admin</option>
                    <option value="padre">Padre</option>
                    <option value="preceptor">Preceptor</option>
                    <option value="profesor">Profesor</option>
                    <option value="secretario">Secretario</option>
                  </select>
                ) : (
                  usuario.rol
                )}
              </td>
              <td>
                {modoEdicion && usuario.id === usuarioEditando ? (
                  <>
                    <button onClick={handleActualizar}>Guardar</button>{' '}
                    <button onClick={handleCancelar}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEditar(usuario)}>Editar</button>{' '}
                    <button onClick={() => handleEliminar(usuario.id)} style={{ color: 'red' }}>
                      Eliminar
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {usuariosPaginados.length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>
                No se encontraron usuarios.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Controles de paginación */}
      {totalPaginas > 1 && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => cambiarPagina(num)}
              style={{
                margin: '0 5px',
                padding: '0.5rem 1rem',
                backgroundColor: num === paginaActual ? '#333' : '#eee',
                color: num === paginaActual ? 'white' : 'black',
                border: '1px solid #ccc',
              }}
            >
              {num}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserAdministrator;

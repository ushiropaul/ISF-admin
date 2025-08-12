// src/pages/profesores.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';

export default function Profesores() {
  const [profesores, setProfesores] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [nuevoProfesor, setNuevoProfesor] = useState({ nombre: '', apellido: '', email: '' });

  // Cargar profesores
  useEffect(() => {
    fetchProfesores();
  }, []);

  const fetchProfesores = async () => {
    const { data, error } = await supabase
      .from('profesores')
      .select(`
        id,
        nombre,
        apellido,
        email,
        usuario_id,
        usuarios ( email, rol )
      `)
      .order('apellido', { ascending: true });

    if (error) console.error(error);
    else setProfesores(data);
  };

  const agregarProfesor = async () => {
    if (!nuevoProfesor.nombre || !nuevoProfesor.apellido || !nuevoProfesor.email) {
      alert('Completa todos los campos');
      return;
    }

    const { error } = await supabase
      .from('profesores')
      .insert([nuevoProfesor]);

    if (error) {
      alert('Error al agregar: ' + error.message);
    } else {
      setNuevoProfesor({ nombre: '', apellido: '', email: '' });
      fetchProfesores();
    }
  };

  const eliminarProfesor = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este profesor?')) return;
    const { error } = await supabase.from('profesores').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchProfesores();
  };

  const filtrados = profesores.filter(p =>
    `${p.nombre} ${p.apellido} ${p.email}`.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestión de Profesores</h1>

      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar..."
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
        className="border px-3 py-1 rounded mb-4 w-full"
      />

      {/* Formulario de nuevo profesor */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Agregar Profesor</h2>
        <input
          type="text"
          placeholder="Nombre"
          value={nuevoProfesor.nombre}
          onChange={e => setNuevoProfesor({ ...nuevoProfesor, nombre: e.target.value })}
          className="border px-2 py-1 mr-2"
        />
        <input
          type="text"
          placeholder="Apellido"
          value={nuevoProfesor.apellido}
          onChange={e => setNuevoProfesor({ ...nuevoProfesor, apellido: e.target.value })}
          className="border px-2 py-1 mr-2"
        />
        <input
          type="email"
          placeholder="Email"
          value={nuevoProfesor.email}
          onChange={e => setNuevoProfesor({ ...nuevoProfesor, email: e.target.value })}
          className="border px-2 py-1 mr-2"
        />
        <button onClick={agregarProfesor} className="bg-blue-500 text-white px-4 py-1 rounded">
          Agregar
        </button>
      </div>

      {/* Tabla de profesores */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Apellido</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Rol Usuario</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map(p => (
            <tr key={p.id}>
              <td className="border p-2">{p.nombre}</td>
              <td className="border p-2">{p.apellido}</td>
              <td className="border p-2">{p.email}</td>
              <td className="border p-2">{p.usuarios?.rol || 'N/A'}</td>
              <td className="border p-2">
                <button
                  onClick={() => eliminarProfesor(p.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {filtrados.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center p-3">No se encontraron profesores</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

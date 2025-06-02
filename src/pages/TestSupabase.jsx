import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const TestSupabase = () => {
  const [alumnos, setAlumnos] = useState([]);

  useEffect(() => {
    async function fetchAlumnos() {
      const { data, error } = await supabase.from('alumnos').select('*');
      if (error) {
        console.error('Error al consultar Supabase:', error.message);
      } else {
        setAlumnos(data);
      }
    }

    fetchAlumnos();
  }, []);

  return (
    <div>
      <h2>Conexión a Supabase</h2>
      <ul>
        {alumnos.map((a) => (
          <li key={a.id}>
            {a.nombre} {a.apellido}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TestSupabase;

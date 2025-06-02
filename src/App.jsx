import { useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  useEffect(() => {
    const fetchAlumnos = async () => {
      const { data, error } = await supabase.from('alumnos').select('*');
      if (error) {
        console.error('Error al obtener alumnos:', error);
      } else {
        console.log('Alumnos:', data);
      }
    };

    fetchAlumnos();
  }, []);

  return (
    <div>
      <h1>Sistema Escolar</h1>
      <p>Ver consola para resultados.</p>
    </div>
  );
}

export default App;

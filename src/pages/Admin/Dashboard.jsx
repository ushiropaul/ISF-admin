import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [rol, setRol] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      setUser(data.user);

      const { data: perfil } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', data.user.id)
        .single();

      setRol(perfil?.rol);
    };

    fetchUser();
  }, []);

  const menuItems = [
    {
      to: '/administrar-usuarios',
      label: '👥 Usuarios',
      roles: ['admin'],
    },
    {
      to: '/admin/alumnos',
      label: '👤 Alumnos',
      roles: ['admin', 'preceptor', 'secretario'],
    },
    {
      to: '/admin/cursos',
      label: '📘 Cursos',
      roles: ['admin', 'secretario'],
    },
    {
      to: '/admin/materias',
      label: '📚 Materias',
      roles: ['admin', 'secretario'],
    },
    {
      to: '/admin/profesores',
      label: '👨‍🏫 Profesores',
      roles: ['admin', 'secretario'],
    },
    {
      to: '/admin/notas',
      label: '📝 Notas',
      roles: ['admin', 'profesor', 'preceptor'],
    },
    {
      to: '/admin/faltas',
      label: '📅 Faltas',
      roles: ['admin', 'preceptor'],
    },
    {
      to: '/admin/enviar-nota',
      label: '✉️ Enviar nota a padres',
      roles: ['admin', 'profesor'],
    },
  ];

  return (
    <div className="dashboard">
      <h1>Panel de Administrador</h1>

      {user && rol ? (
        <ul className="dashboard-menu">
          {menuItems
            .filter((item) => item.roles.includes(rol))
            .map((item) => (
              <li key={item.to}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
        </ul>
      ) : (
        <p>Cargando permisos...</p>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './../../supabaseClient';
import './Navbar.css';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [rol, setRol] = useState(null);
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRol(null);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/">Inicio</Link>
      {!user && <Link to="/login">inicia sesión</Link>}
      {user && rol === 'padre' && <Link to="/panel">Panel de padres</Link>}
      {!user && <Link to="/registro">Registrarse</Link>}
      {user && rol === 'admin' && <Link to="/admin/">Admin</Link>}
      {user && rol === 'admin' && <Link to="/panel/">Panel de padres</Link>}
      {user && <button onClick={handleLogout}>Cerrar sesión</button>}  {/*<---- mas tarde, cambiar la funcion de cerrar sesion a otra pagina, con mas filtros y seguridad*/}
    </nav>
  );
}

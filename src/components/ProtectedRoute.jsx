import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from './../supabaseClient';

export default function ProtectedRoute({ children }) {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return setAllowed(false);

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', authData.user.id)
        .single();

      setAllowed(usuario?.rol === 'admin');
    };

    checkAccess();
  }, []);

  if (allowed === null) return <p>Cargando...</p>;
  if (!allowed) return <Navigate to="/login" />;

  return children;
}

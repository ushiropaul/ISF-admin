import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from './../supabaseClient';

export default function ProtectedRoute({ children, rolesPermitidos = ['admin'] }) {
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

      // Verificamos si su rol está dentro de los permitidos
      setAllowed(usuario && rolesPermitidos.includes(usuario.rol));
    };

    checkAccess();
  }, [rolesPermitidos]);

  if (allowed === null) return <p>Cargando...</p>;
  if (!allowed) return <Navigate to="/login" />;

  return children;
}

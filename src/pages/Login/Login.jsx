import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './../../supabaseClient';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) return setError('Email o contraseña incorrectos');

    const user = signInData.user;

    // Verificar si es admin por email
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('rol')
      .eq('email', user.email)
      .single();

    if (admin && admin.rol === 'admin' && !adminError) {
      return navigate('/admin/');
    }


    // No es admin, verificar si ya tiene fila en usuarios
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', user.id)
      .single();

    if (usuarioError || !usuario) {
      // No tiene fila, crearla
      const { error: insertError } = await supabase.from('usuarios').insert([
        {
          id: user.id,
          email: user.email,
          rol: 'padre'
        }
      ]);

      if (insertError) {
        return setError('Error al crear perfil de usuario: ' + insertError.message);
      }
    }

    // Redirigir a panel de usuario
    navigate('/panel/');
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Iniciar sesión</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        required
      />
      <button type="submit">Ingresar</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

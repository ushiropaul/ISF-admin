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

    const { data: perfil, error: perfilError } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (perfilError || !perfil) {
      return setError('No se pudo obtener el perfil del usuario');
    }

    // Redirigir según el rol
    if (perfil.rol === 'admin') {
      return navigate('/admin/');
    }

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

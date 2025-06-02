import { useState } from 'react';
import { useNavigate } from 'react-router-dom'
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

    const { data: usuario, error: rolError } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', signInData.user.id)
      .single();

    if (rolError || !usuario || usuario.rol !== 'admin') {
      setError('Acceso restringido solo para administradores');
      return;
    }

    navigate('/admin/dashboard');
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Login administrador</h2>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" required />
      <button type="submit">Ingresar</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

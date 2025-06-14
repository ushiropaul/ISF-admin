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


    const handleForgotPassword = async () => {
    if (!email) {
      return setError('Ingresá tu email para recuperar tu contraseña');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://isfsistemaescolar.netlify.app/recuperar-contraseña/' // CAMBIA ESTO en producción
    });

    if (error) {
      return setError('Error al enviar email de recuperación: ' + error.message);
    }

    alert('Te enviamos un correo para restablecer tu contraseña.');
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
      <p style={{ marginTop: '1rem' }}>
      <button
        type="button"
        onClick={() => handleForgotPassword()}
        style={{ color: 'blue', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        ¿Olvidaste tu contraseña?
      </button>
    </p>

    </form>
  );
}

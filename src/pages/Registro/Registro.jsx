import { useState } from 'react';
import { supabase } from './../../supabaseClient.js';
import { useNavigate } from 'react-router-dom';

export default function Registro() {
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password
    });

    if (signUpError) {
      setError('Error al registrar: ' + signUpError.message);
      return;
    }

    setMensaje('Registro exitoso. Revisa tu email para confirmar la cuenta.');
    setForm({ email: '', password: '' });

    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h2>Registro de Usuario</h2>
      {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Registrarse</button>
      </form>
    </div>
  );
}

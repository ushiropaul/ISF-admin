import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Registro() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    num_cel: ''
  });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password
    });

    if (signUpError) {
      setError('Error al registrar: ' + signUpError.message);
      return;
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      setError('No se pudo obtener ID del usuario.');
      return;
    }

    const { error: insertError } = await supabase.from('usuarios').insert([
      {
        id: userId,
        email: form.email,
        nombre: form.nombre,
        apellido: form.apellido,
        num_cel: form.num_cel,
        rol: 'padre'
      }
    ]);

    if (insertError) {
      setError('Error al guardar datos personales: ' + insertError.message);
      return;
    }

    setMensaje('Registro exitoso. Revisa tu email.');
    setTimeout(() => navigate('/login'), 2500);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h2>Registro</h2>
      {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" name="email" placeholder="Email" required value={form.email} onChange={handleChange} />
        <input type="password" name="password" placeholder="Contraseña" required value={form.password} onChange={handleChange} />
        <input type="text" name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} />
        <input type="text" name="apellido" placeholder="Apellido" value={form.apellido} onChange={handleChange} />
        <input type="text" name="num_cel" placeholder="Celular" value={form.num_cel} onChange={handleChange} />
        <button type="submit">Registrarse</button>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { supabase } from './../../supabaseClient.js';
import { useNavigate } from 'react-router-dom'

export default function Registro() {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    num_cel: '',
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
        rol: 'padre',
        nombre: form.nombre,
        apellido: form.apellido,
        num_cel: form.num_cel
      }
    ]);

    if (insertError) {
      setError('Error al guardar datos personales: ' + insertError.message);
      return;
    }

    setMensaje('Registro exitoso. Revisa tu email para confirmar la cuenta.');
    setForm({
      nombre: '',
      apellido: '',
      num_cel: '',
      email: '',
      password: ''
    });

        navigate('/registro/');
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h2>Registro de Padre</h2>
      {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
        <input type="text" name="apellido" placeholder="Apellido" value={form.apellido} onChange={handleChange} required />
        <input type="text" name="num_cel" placeholder="Número de celular" value={form.num_cel} onChange={handleChange} />
        <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Contraseña" value={form.password} onChange={handleChange} required />
        <button type="submit">Registrarse</button>
      </form>
    </div>
  );
}

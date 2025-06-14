import { useState } from 'react';
import { supabase } from './../../supabaseClient.js';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      alert('Contraseña actualizada con éxito.');
      navigate('/'); // Volver al login
    }
  };

  return (
    <form onSubmit={handleReset}>
      <h2>Restablecer contraseña</h2>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Nueva contraseña"
        required
      />
      <button type="submit">Actualizar</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

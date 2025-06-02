import { Link } from "react-router-dom";



export default function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h1>Bienvenido al Sistema Escolar</h1>
      <Link to='/login'>inicia sesión</Link>
    </div>
  );
}

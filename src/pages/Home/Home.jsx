import { Link } from "react-router-dom";

import './Home.css'


export default function Home() {
  return (
    <div className="Div1" style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h1>Bienvenido al Sistema Escolar ISF</h1>
      <Link to='/login'>inicia sesión</Link>
    </div>
  );
}

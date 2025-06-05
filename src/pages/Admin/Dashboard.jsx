import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Panel de Administrador</h1>
      <ul className="dashboard-menu">
        <li><Link to="/admin/alumnos">👤 Alumnos</Link></li>
        <li><Link to="/admin/cursos">📘 Cursos</Link></li>
        <li><Link to="/admin/materias">📚 Materias</Link></li>
        <li><Link to="/admin/profesores">👨‍🏫 Profesores</Link></li>
        <li><Link to="/admin/notas">📝 Notas</Link></li>
        <li><Link to="/admin/asistencias">📅 Asistencias</Link></li>
        <li><Link to="/admin/enviar-nota">✉️ Enviar nota a padres</Link></li>
      </ul>
    </div>
  );
}

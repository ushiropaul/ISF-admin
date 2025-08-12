import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Dashboard from './pages/Admin/Dashboard';
import PanelPadres from './pages/Padres/Panel';
import Navbar from './components/Navbar/Navbar.jsx';
import Alumnos  from './pages/Admin/Alumnos.jsx';
import Registro from './pages/Registro/Registro.jsx';
import ResetPassword from './pages/ResetPassword/ResetPassword.jsx';
import UserAdministrator from './pages/UserAdministrator/UserAdministrator.jsx';
import Nota from './pages/Admin/Notas.jsx';
import Faltas from './pages/Admin/Faltas.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import Profesores from './pages/Admin/Profesores.jsx';
import Boletines from './pages/Admin/boletines.jsx';

function App() {
  return (
    <BrowserRouter>
    <Navbar />
      <Routes>

        {/* de inicio */}
        <Route path="/" element={<Home />} /> 
        <Route path="/login" element={<Login />} />
        <Route path='/registro' element={ <Registro/>}  />
        <Route path='/recuperar-contraseña/' element={ <ResetPassword/> } />

        {/* prohibido*/}
        <Route
        path="/admin"
        element={
            <ProtectedRoute rolesPermitidos={['admin', 'preceptor', 'secretario', 'profesor']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
        path="/admin/notas"
        element={
            <ProtectedRoute rolesPermitidos={['admin', 'preceptor', 'secretario', 'profesor']}>
              <Nota />
            </ProtectedRoute>
          }
        />

        <Route
        path="/admin/faltas"
        element={
            <ProtectedRoute rolesPermitidos={['admin', 'preceptor', 'secretario', 'profesor']}>
              <Faltas />
            </ProtectedRoute>
          }
        />

        <Route
        path="/admin/boletines"
        element={
            <ProtectedRoute rolesPermitidos={['admin', 'preceptor', 'secretario', 'profesor']}>
              < Boletines/>
            </ProtectedRoute>
          }
        />


      <Route
        path="/admin/profesores"
        element={
            <ProtectedRoute rolesPermitidos={['admin', 'preceptor', 'secretario', 'profesor']}>
              < Profesores/>
            </ProtectedRoute>
          }
        />

        <Route
          path="/administrar-usuarios"
          element={
              <ProtectedRoute rolesPermitidos={['admin']}>
                <UserAdministrator />
              </ProtectedRoute>
            
          }
        />

        <Route path='/admin/alumnos' element={ 
          <ProtectedRoute rolesPermitidos={['admin', 'preceptor', 'secretario']}>
            <Alumnos/>
          </ProtectedRoute> 
      }/>




        {/* publico */}
        <Route path="/panel" element={<PanelPadres />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

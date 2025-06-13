import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Dashboard from './pages/Admin/Dashboard';
import PanelPadres from './pages/Padres/Panel';
import Navbar from './components/Navbar/Navbar.jsx';
import Alumnos  from './pages/Admin/Alumnos.jsx';
import Registro from './pages/Registro/Registro.jsx';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
    <Navbar />
      <Routes>

        {/* de inicio */}
        <Route path="/" element={<Home />} /> 
        <Route path="/login" element={<Login />} />
        <Route path='/registro' element={ <Registro/>}  />

        {/* prohibido , mas tarde poner protected routes*/}
        <Route
          path="/admin"
          element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            
          }
        />
        <Route path='/admin/alumnos' element={ 
          <ProtectedRoute>
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

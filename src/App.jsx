import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Dashboard from './pages/Admin/Dashboard';
import PanelPadres from './pages/Padres/Panel';
import Navbar from './components/Navbar/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
    <Navbar />
      <Routes>
        <Route path="/" element={<Home />} /> 
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/panel" element={<PanelPadres />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

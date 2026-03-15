import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Navbar, Nav, Button, Badge } from 'react-bootstrap';

import SeleccionEmergencia from './components/SeleccionEmergencia';
import FormularioParte from './components/FormularioParte';
import HistorialPartes from './components/HistorialPartes';
import Estadisticas from './components/Estadisticas';
import Login from './components/Login';
import GestionUsuarios from './components/GestionUsuarios';
import SessionHandler from './components/AvisoCerrarSesion';
import Inventario from './components/Inventario';
import Inicio from './components/Inicio';
import Despacho from './components/Despacho';

import {
    FaSignOutAlt, FaUserCog, FaFireExtinguisher,
    FaClipboardList, FaChartPie, FaHome, FaUserCircle, FaBoxOpen, FaBullhorn
} from 'react-icons/fa';

function App() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('token_bomberos'));

  const [usuario, setUsuario] = useState({
      es_admin: localStorage.getItem('es_admin') === 'true',
      nombre: localStorage.getItem('usuario_nombre') || 'Usuario',
      rango: localStorage.getItem('usuario_rango') || '',
  });
  
  const [emergenciaSeleccionada, setEmergenciaSeleccionada] = useState(null);

  useEffect(() => {
    // CONFIGURACIÓN GLOBAL DE AXIOS
    axios.defaults.baseURL = import.meta.env.VITE_API_URL;

    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }

    const interceptor = axios.interceptors.response.use(
        response => response,
        error => {
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                handleLogout();
            }
            return Promise.reject(error);
        }
    );

    return () => {
        axios.interceptors.response.eject(interceptor);
    };
  }, [token]);

  const handleLoginSuccess = (tokenRecibido, esAdmin, nombreCompleto, rangoRecibido) => {
    localStorage.setItem('token_bomberos', tokenRecibido);
    localStorage.setItem('es_admin', esAdmin);
    localStorage.setItem('usuario_nombre', nombreCompleto);
    localStorage.setItem('usuario_rango', rangoRecibido);
    axios.defaults.headers.common['Authorization'] = `Bearer ${tokenRecibido}`;
    setToken(tokenRecibido);
    setUsuario({ es_admin: esAdmin, nombre: nombreCompleto, rango: rangoRecibido });
    navigate('/');
  };

  const handleLogout = () => {
      localStorage.clear();
      setToken(null);
      setUsuario(null);
      delete axios.defaults.headers.common['Authorization'];
      navigate('/');
  };

  const alSeleccionarEmergencia = (tipoObj) => {
    setEmergenciaSeleccionada(tipoObj);
    navigate('/formulario');
  };

  if (!token) {
      return <Login onLogin={handleLoginSuccess} />;
  }

  const navbarStyle = {
      background: 'linear-gradient(90deg, #d92027 0%, #8a1217 100%)',
      borderBottom: '4px solid #ffc107',
  };

  const linkStyle = {
      textDecoration: 'none',
      color: 'rgba(255,255,255,0.8)',
      fontWeight: '500',
      padding: '0.5rem',
      transition: 'color 0.2s'
  };

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh' }}>

      <SessionHandler onLogout={handleLogout} />

      <Navbar expand="lg" variant="dark" className="mb-4 shadow" style={navbarStyle} sticky="top">
        <Container fluid className="px-4">
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center me-4" style={{cursor: 'pointer', fontSize: '1.5rem', fontWeight: 'bold'}}>
            <div className="bg-white text-danger rounded-circle p-2 me-2 d-flex align-items-center justify-content-center shadow-sm" style={{width: 45, height: 45}}>
                <FaFireExtinguisher size={24} />
            </div>
            Gestión Bomberos
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />

          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto ms-2 gap-3">
                <Nav.Link as={Link} to="/" style={linkStyle}>
                    <FaHome className="me-2 mb-1"/>Inicio
                </Nav.Link>

                <Nav.Link as={Link} to="/ingreso" style={linkStyle}>
                    <FaFireExtinguisher className="me-2 mb-1"/>Ingreso
                </Nav.Link>

                <Nav.Link as={Link} to="/historial" style={linkStyle}>
                    <FaClipboardList className="me-2 mb-1"/>Historial
                </Nav.Link>

                {(usuario?.es_admin || !['VOLUNTARIO', 'TESORERO','SECRETARIO'].includes(usuario?.rango)) && (
                    <Nav.Link as={Link} to="/inventario" style={linkStyle}>
                        <FaBoxOpen className="me-2 mb-1"/>Inventario
                    </Nav.Link>
                )}

                {(usuario?.es_admin || ['DIRECTOR', 'CAPITAN','SUPERINTENDENTE', 'COMANDANTE'].includes(usuario?.rango)) && (
                    <>
                    <Nav.Link as={Link} to="/estadisticas" style={linkStyle}>
                        <FaChartPie className="me-2 mb-1"/>Estadísticas
                    </Nav.Link>
                    <Nav.Link as={Link} to="/usuarios" style={{...linkStyle, color: '#ffc107'}}>
                        <FaUserCog className="me-2 mb-1"/>Personal
                    </Nav.Link>
                    </>
                )}

                {(usuario?.es_admin || usuario?.rango === 'CENTRALISTA') && (
                    <Nav.Link as={Link} to="/despacho" style={{...linkStyle, color: '#00e676'}}>
                        <FaBullhorn className="me-2 mb-1"/> Despacho
                    </Nav.Link>
                )}
            </Nav>

            <Nav className="align-items-center gap-3 mt-3 mt-lg-0">
                <div className="text-white d-flex align-items-center me-2">
                    <FaUserCircle size={20} className="me-2 opacity-75"/>
                    <span className="fw-bold me-1">
                        {usuario.nombre}
                    </span>
                    <span className="fw-bold" style={{ color: '#ffc107' }}>
                        {usuario.rango}
                    </span>
                </div>

                {usuario?.es_admin && (
                    <Badge bg="warning" text="dark" className="px-2 py-1 shadow-sm d-none d-lg-block" style={{fontSize: '0.7rem'}}>
                        ADMIN
                    </Badge>
                )}

                <Button
                    variant="outline-light" size="sm"
                    onClick={handleLogout}
                    className="rounded-pill px-3 border-2 fw-bold"
                >
                    Salir <FaSignOutAlt className="ms-2"/>
                </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

        <Container>
            <Routes>
                <Route path="/" element={<Inicio />} />
                <Route path="/ingreso" element={<SeleccionEmergencia alSeleccionar={alSeleccionarEmergencia} />} />
                <Route path="/formulario" element={<FormularioParte tipoPreseleccionado={emergenciaSeleccionada} />} />
                <Route path="/historial" element={<HistorialPartes />} />
                
                {(usuario?.es_admin || !['VOLUNTARIO', 'TESORERO','SECRETARIO'].includes(usuario?.rango)) && (
                     <Route path="/inventario" element={<Inventario />} />
                )}

                {(usuario?.es_admin || ['DIRECTOR', 'CAPITAN', 'SUPERINTENDENTE', 'COMANDANTE'].includes(usuario?.rango)) && (
                    <>
                        <Route path="/estadisticas" element={<Estadisticas />} />
                        <Route path="/usuarios" element={<GestionUsuarios />} />
                    </>
                )}

                {(usuario?.es_admin || usuario?.rango === 'CENTRALISTA') && (
                    <Route path="/despacho" element={<Despacho />} />
                )}
            </Routes>
        </Container>
    </div>
  );
}

export default App;
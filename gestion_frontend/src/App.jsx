import { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Navbar, Nav, Button, Badge } from 'react-bootstrap';

// --- COMPONENTES ---
import SeleccionEmergencia from './components/SeleccionEmergencia';
import FormularioParte from './components/FormularioParte';
import HistorialPartes from './components/HistorialPartes';
import Estadisticas from './components/Estadisticas';
import Login from './components/Login';
import GestionUsuarios from './components/GestionUsuarios'; 
import SessionHandler from './components/AvisoCerrarSesion'; 
import Inventario from './components/Inventario';       
// --- ICONOS ---
import { 
    FaSignOutAlt, FaUserCog, FaFireExtinguisher, 
    FaClipboardList, FaChartPie, FaHome, FaUserCircle, FaBoxOpen 
} from 'react-icons/fa';

function App() {
  // 1. ESTADOS DE SESIÓN
  const [token, setToken] = useState(localStorage.getItem('token_bomberos'));
  
  const [usuario, setUsuario] = useState({ 
      es_admin: localStorage.getItem('es_admin') === 'true',
      nombre: localStorage.getItem('usuario_nombre') || 'Usuario'
  });
  
  const [vista, setVista] = useState('seleccion'); 
  const [emergenciaSeleccionada, setEmergenciaSeleccionada] = useState(null);

  // 2. CONFIGURACIÓN DE SEGURIDAD 
  useEffect(() => {
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

  // 3. Login / Logout / Navegación
  const handleLoginSuccess = (tokenRecibido, esAdmin, nombreCompleto) => {
      localStorage.setItem('token_bomberos', tokenRecibido);
      localStorage.setItem('es_admin', esAdmin);
      localStorage.setItem('usuario_nombre', nombreCompleto);
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokenRecibido}`; 
      setToken(tokenRecibido);
      setUsuario({ es_admin: esAdmin, nombre: nombreCompleto });
  };

  const handleLogout = () => {
      localStorage.clear(); 
      setToken(null);
      setUsuario(null);
      setVista('seleccion');
      delete axios.defaults.headers.common['Authorization'];
  };

  const alSeleccionarEmergencia = (tipoObj) => {
    setEmergenciaSeleccionada(tipoObj);
    setVista('formulario');
  };

  const irAInicio = () => {
    setEmergenciaSeleccionada(null);
    setVista('seleccion');
  };

  // 4. MOSTRAR LOGIN
  if (!token) {
      return <Login onLogin={handleLoginSuccess} />;
  }

  // ESTILOS DE BARRA
  const navbarStyle = {
      background: 'linear-gradient(90deg, #d92027 0%, #8a1217 100%)',
      borderBottom: '4px solid #ffc107',
  };

  const linkStyle = (nombreVista) => ({
      color: 'white',
      fontWeight: vista === nombreVista ? 'bold' : 'normal',
      borderBottom: vista === nombreVista ? '3px solid white' : '3px solid transparent',
      paddingBottom: '5px',
      transition: 'all 0.2s',
      cursor: 'pointer'
  });

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      
      {/*Cierra sesión si no haces nada*/}
      <SessionHandler onLogout={handleLogout} />

      {/* BARRA SUPERIOR */}
      <Navbar expand="lg" variant="dark" className="mb-4 shadow" style={navbarStyle} sticky="top">
        <Container fluid className="px-4">
          <Navbar.Brand onClick={irAInicio} className="d-flex align-items-center me-4" style={{cursor: 'pointer', fontSize: '1.5rem', fontWeight: 'bold'}}>
            <div className="bg-white text-danger rounded-circle p-2 me-2 d-flex align-items-center justify-content-center shadow-sm" style={{width: 45, height: 45}}>
                <FaFireExtinguisher size={24} />
            </div>
            Gestión Bomberos
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto ms-2 gap-3">
                {/* --- MENÚ GENERAL --- */}
                <Nav.Link onClick={irAInicio} style={linkStyle(vista === 'seleccion' || vista === 'formulario' ? vista : 'seleccion')}>
                    <FaHome className="me-2 mb-1"/>Ingreso
                </Nav.Link>
                
                <Nav.Link onClick={() => setVista('historial')} style={linkStyle('historial')}>
                    <FaClipboardList className="me-2 mb-1"/>Historial
                </Nav.Link>

                <Nav.Link onClick={() => setVista('inventario')} style={linkStyle('inventario')}>
                    <FaBoxOpen className="me-2 mb-1"/>Inventario
                </Nav.Link>
                
                {/* --- MENÚ ADMIN --- */}
                {usuario?.es_admin && (
                    <>
                        <Nav.Link onClick={() => setVista('estadisticas')} style={linkStyle('estadisticas')}>
                            <FaChartPie className="me-2 mb-1"/>Estadísticas
                        </Nav.Link>
                        <Nav.Link onClick={() => setVista('usuarios')} style={{...linkStyle('usuarios'), color: '#ffc107'}}>
                            <FaUserCog className="me-2 mb-1"/>Personal
                        </Nav.Link>
                    </>
                )}
            </Nav>

            <Nav className="align-items-center gap-3 mt-3 mt-lg-0">
                <div className="text-white d-flex align-items-center me-2">
                    <FaUserCircle size={20} className="me-2 opacity-75"/>
                    <span className="fw-bold">{usuario.nombre}</span>
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

      {/* ---  VISTAS --- */}
      
      {vista === 'seleccion' && <SeleccionEmergencia alSeleccionar={alSeleccionarEmergencia} />}
      
      {vista === 'formulario' && <FormularioParte tipoPreseleccionado={emergenciaSeleccionada} />}
      
      {vista === 'historial' && <HistorialPartes />}
      
      {vista === 'inventario' && <Inventario />}

      {/* Admin */}
      {vista === 'estadisticas' && usuario?.es_admin && <Estadisticas />}
      
      {vista === 'usuarios' && usuario?.es_admin && <GestionUsuarios />}
      
    </div>
  );
}

export default App;
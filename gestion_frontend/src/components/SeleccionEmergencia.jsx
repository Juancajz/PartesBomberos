import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom'; 
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaBuilding, FaCarCrash, FaTree, FaUserInjured, FaCloud, FaBolt, FaIndustry, FaTools, FaCubes, FaPlane, FaHandshake, FaBomb, FaShip, FaFireExtinguisher, FaStar,FaSearch, FaHouseDamage, FaWater, FaExclamationCircle, FaCarSide } from 'react-icons/fa';

function SeleccionEmergencia({ alSeleccionar }) {
  const [tipos, setTipos] = useState([]);
  const location = useLocation(); 

  // --- EL PUENTE SECRETO CON "FRENO DE MANO" ---
  useEffect(() => {
    // Solo revisamos la mochila al cargar la pantalla.
    if (location.state && location.state.parteEdicionId) {
        // Le pasamos un ID temporal para que el Formulario nos deje pasar
        alSeleccionar({ id: 9999, codigo: 'MODO EDICIÓN', descripcion: 'Cargando datos...' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- ESTE ARRAY VACÍO ES LA CLAVE. Evita el bucle infinito.

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/tipos-emergencia/')
        .then(response => {
            const listaOrdenada = response.data.sort((a, b) => {
            return a.codigo.localeCompare(b.codigo, undefined, { numeric: true });
            });
            
            setTipos(listaOrdenada);
        }).catch(err => console.error(err));
  }, []);

  const getIcono = (codigo) => {
    const cod = String(codigo).trim(); 
    const size = 45; 

    const mapaIconos = {
        '10-0': <FaBuilding size={size} />,          
        '10-1': <FaCarSide size={size} />,           
        '10-2': <FaTree size={size} />,              
        '10-3': <FaUserInjured size={size} />,       
        '10-4': <FaCarCrash size={size} />,          
        '10-6': <FaCloud size={size} />,             
        '10-7': <FaBolt size={size} />,              
        '10-8': <FaIndustry size={size} />,          
        '10-9': <FaTools size={size} />,             
        '10-10': <FaCubes size={size} />,            
        '10-11': <FaPlane size={size} />,            
        '10-12': <FaHandshake size={size} />,        
        '10-13': <FaBomb size={size} />,             
        '10-14': <FaPlane size={size} />,            
        '10-15': <FaShip size={size} />,             
        '10-16': <FaFireExtinguisher size={size} />, 
        '10-17': <FaStar size={size} />,             
        '10-18': <FaSearch size={size} />,           
        '10-19': <FaHouseDamage size={size} />,      
        '10-20': <FaWater size={size} />,            
    };
    return mapaIconos[cod] || <FaExclamationCircle size={size} />;
  };

  return (
    <Container className="mt-4">
      <h3 className="text-center mb-4 text-secondary">Seleccione tipo de emergencia</h3>
      <Row className="g-3"> 
        {tipos.map((tipo) => (
          <Col xs={12} sm={6} md={3} key={tipo.id}>
            <Card 
              className="h-100 shadow-sm text-center p-3 border-0" 
              style={{ cursor: 'pointer', transition: '0.3s' }}
              onClick={() => alSeleccionar(tipo)} 
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                <div className="mb-3 text-danger">
                  {getIcono(tipo.codigo)}
                </div>
                <Card.Title as="h5">{tipo.codigo}</Card.Title>
                <Card.Text className="text-muted small">
                  {tipo.descripcion}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default SeleccionEmergencia;
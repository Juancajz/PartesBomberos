import { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaBuilding, FaCarCrash, FaTree, FaUserInjured, FaCloud, FaBolt, FaIndustry, FaTools, FaCubes, FaPlane, FaHandshake, FaBomb, FaShip, FaFireExtinguisher, FaStar,FaSearch, FaHouseDamage, FaWater, FaExclamationCircle, FaCarSide } from 'react-icons/fa';

function SeleccionEmergencia({ alSeleccionar }) {
  const [tipos, setTipos] = useState([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/tipos-emergencia/')
        .then(response => {
            const listaOrdenada = response.data.sort((a, b) => {
            return a.codigo.localeCompare(b.codigo, undefined, { numeric: true });
            });
            
            setTipos(listaOrdenada);
        })
  }, []);


  const getIcono = (codigo) => {
    const cod = String(codigo).trim(); 
    const size = 45; 

    const mapaIconos = {
        '10-0': <FaBuilding size={size} />,          // Estructural
        '10-1': <FaCarSide size={size} />,           // Incendio Vehículo
        '10-2': <FaTree size={size} />,              // Pastizal/Forestal
        '10-3': <FaUserInjured size={size} />,       // Rescate Persona
        '10-4': <FaCarCrash size={size} />,          // Rescate Vehicular
        // 10-5 Hazmat (si lo tuvieras)
        '10-6': <FaCloud size={size} />,             // Gases
        '10-7': <FaBolt size={size} />,              // Eléctrico
        '10-8': <FaIndustry size={size} />,          // Refinería/Hidrocarburos
        '10-9': <FaTools size={size} />,             // Otros Servicios
        '10-10': <FaCubes size={size} />,            // Escombros
        '10-11': <FaPlane size={size} />,            // Servicio Aéreo
        '10-12': <FaHandshake size={size} />,        // Apoyo a otros cuerpos
        '10-13': <FaBomb size={size} />,             // Artefacto Explosivo
        '10-14': <FaPlane size={size} />,            // Accidente Aéreo
        '10-15': <FaShip size={size} />,             // Marítimo
        '10-16': <FaFireExtinguisher size={size} />, // Emergencia Pequeña
        '10-17': <FaStar size={size} />,             // Servicio Especial
        '10-18': <FaSearch size={size} />,           // Verificación
        '10-19': <FaHouseDamage size={size} />,      // Derrumbe
        '10-20': <FaWater size={size} />,            // Inundación
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
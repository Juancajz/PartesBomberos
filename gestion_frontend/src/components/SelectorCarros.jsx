import { useState, useEffect } from 'react';
import axios from 'axios';
import { Row, Col, Button, Card } from 'react-bootstrap';
import { FaTruckMonster } from 'react-icons/fa';

function SelectorCarros({ alCambiarCarros }) {
    const [listaCarros, setListaCarros] = useState([]);
    const [seleccionados, setSeleccionados] = useState([]);

    // 1. Cargar carros desde Django
    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/carros/')
            .then(res => setListaCarros(res.data))
            .catch(err => console.error("Error cargando carros:", err));
    }, []);

    const toggleCarro = (id) => {
        let nuevosSeleccionados;
        if (seleccionados.includes(id)) {
            
            nuevosSeleccionados = seleccionados.filter(carroId => carroId !== id);
        } else {
            
            nuevosSeleccionados = [...seleccionados, id];
        }
        setSeleccionados(nuevosSeleccionados);
        alCambiarCarros(nuevosSeleccionados); 
    };

    return (
        <Card className="mb-3 shadow-sm border-0">
            <Card.Header className="bg-secondary text-white">
                <FaTruckMonster className="me-2"/> Material Mayor (Carros)
            </Card.Header>
            <Card.Body>
                <Row className="g-2">
                    {listaCarros.map(carro => {
                        const estaSeleccionado = seleccionados.includes(carro.id);
                        return (
                            <Col xs={4} sm={3} md={2} key={carro.id}>
                                <Button 
                                    variant={estaSeleccionado ? "danger" : "outline-secondary"}
                                    className="w-100 d-flex flex-column align-items-center justify-content-center py-3 shadow-sm"
                                    onClick={() => toggleCarro(carro.id)}
                                    style={{ transition: 'all 0.2s' }}
                                >
                                    <strong className="fs-5">{carro.nombre}</strong>
                                
                                    {estaSeleccionado && (
                                        <div className="mt-2 animacion-entrada">
                                             <FaTruckMonster size={32} color="white" />
                                        </div>
                                    )}
        
                                </Button>
                            </Col>
                        );
                    })}
                    {listaCarros.length === 0 && <p className="text-muted">Cargando unidades...</p>}
                </Row>
            </Card.Body>
        </Card>
    );
}

export default SelectorCarros;
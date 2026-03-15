import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Row, Col, Card, Badge } from 'react-bootstrap';
import { FaTruck, FaUserSecret } from 'react-icons/fa';
import SelectorCarros from '../SelectorCarros';

function Paso3Recursos({ 
    formulario, 
    handleInputChange, 
    setCarrosSeleccionados, 
    listaBomberos,
    carrosSeleccionados, 
    datosPorCarro,       
    handleCarroChange    
}) {
  const [nombresCarros, setNombresCarros] = useState({});

  // Obtenemos nombres de carros para mostrar en las tarjetas
  useEffect(() => {
    axios.get('/api/carros/').then(res => {
        const mapa = {};
        res.data.forEach(c => mapa[c.id] = c.nombre);
        setNombresCarros(mapa);
    });
  }, []);

  return (
    <div className="animacion-fade">
      <h5 className="text-secondary border-bottom pb-2">
        <FaTruck className="me-2" />Recursos y Tiempos
      </h5>
      
      {/* Selector Principal */}
      <SelectorCarros alCambiarCarros={setCarrosSeleccionados} />
      
      {/* Tarjetas Dinámicas por Carro */}
      <div className="mt-4">
        {carrosSeleccionados.map(carroId => (
            <Card key={carroId} className="mb-3 border-danger shadow-sm">
                <Card.Header className="bg-danger text-white d-flex justify-content-between align-items-center">
                    <span className="fw-bold">
                        <FaTruck className="me-2"/>{nombresCarros[carroId] || `Carro #${carroId}`}
                    </span>
                    <Badge bg="light" text="dark">Unidad Activa</Badge>
                </Card.Header>
                <Card.Body className="bg-light">
                    <Row>
                        {/* Maquinista */}
                        <Col md={12} className="mb-3">
                            <Form.Label className="small fw-bold text-secondary">
                                <FaUserSecret className="me-1"/>Maquinista / Conductor (*)
                            </Form.Label>
                            <Form.Select 
                                value={datosPorCarro[carroId]?.conductor || ''} 
                                onChange={(e) => handleCarroChange(carroId, 'conductor', e.target.value)}
                                size="sm"
                            >
                                <option value="">Seleccione Conductor...</option>
                                {listaBomberos.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.nombre_completo} ({b.rango_texto})
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        
                        {/* Kilometraje */}
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="small fw-bold">Km Salida (*)</Form.Label>
                                <Form.Control 
                                    type="number" 
                                    value={datosPorCarro[carroId]?.km_salida || ''}
                                    onChange={(e) => handleCarroChange(carroId, 'km_salida', e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="small fw-bold">Km Llegada (*)</Form.Label>
                                <Form.Control 
                                    type="number" 
                                    value={datosPorCarro[carroId]?.km_llegada || ''}
                                    onChange={(e) => handleCarroChange(carroId, 'km_llegada', e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        ))}
        
        {carrosSeleccionados.length === 0 && (
            <div className="alert alert-warning text-center small">
                ⚠️ Selecciona al menos una unidad arriba para asignar personal y kilometraje.
            </div>
        )}
      </div>

      {/* Cronología General */}
      <div className="p-3 bg-white border rounded mt-3 shadow-sm">
        <h6 className="text-secondary fw-bold border-bottom pb-2">Cronología General del Acto</h6>
        <Row className="g-2 mb-2">
          <Col><Form.Label className="small fw-bold">Salida (6-0) *</Form.Label><Form.Control type="time" name="hora_salida_cuartel" value={formulario.hora_salida_cuartel} onChange={handleInputChange} /></Col>
          <Col><Form.Label className="small fw-bold">Llegada (6-3) *</Form.Label><Form.Control type="time" name="hora_llegada_emergencia" value={formulario.hora_llegada_emergencia} onChange={handleInputChange} /></Col>
          <Col><Form.Label className="small fw-bold">Control *</Form.Label><Form.Control type="time" name="hora_control_emergencia" value={formulario.hora_control_emergencia} onChange={handleInputChange} /></Col>
        </Row>
        <Row className="g-2">
          <Col><Form.Label className="small fw-bold">Extinción *</Form.Label><Form.Control type="time" name="hora_extincion" value={formulario.hora_extincion} onChange={handleInputChange} /></Col>
          <Col><Form.Label className="small fw-bold">Termino (6-10) *</Form.Label><Form.Control type="time" name="hora_termino_emergencia" value={formulario.hora_termino_emergencia} onChange={handleInputChange} /></Col>
        </Row>
      </div>
    </div>
  );
}

export default Paso3Recursos;
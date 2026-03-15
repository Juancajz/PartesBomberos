import React from 'react';
import { Form, Row, Col, Button, Card } from 'react-bootstrap';
import { FaUsers, FaShieldAlt } from 'react-icons/fa';

function Paso4Asistencia({ listaBomberos, asistenciaBomberos, toggleBombero, apoyoExterno, handleExternoCheck, handleExternoChange }) {
  
  const bomberosPorCia = (cia) => listaBomberos.filter(b => b.compania === cia);

  return (
    <div className="animacion-fade">
      <Row>
        <Col md={6} className="border-end">
          <h5 className="text-secondary mb-3"><FaUsers className="me-2" />Asistencia Cias</h5>
          {['PRIMERA', 'SEGUNDA', 'TERCERA'].map(cia => (
            <div key={cia} className="mb-4">
              <h6 className="text-danger fw-bold border-bottom">{cia} COMPAÑÍA</h6>
              <div className="d-flex flex-wrap gap-2">
                {bomberosPorCia(cia).map(bombero => {
                  const seleccionado = asistenciaBomberos.includes(bombero.id);
                  return (
                    <Button
                      key={bombero.id}
                      size="sm"
                      variant={seleccionado ? "danger" : "outline-secondary"}
                      onClick={() => toggleBombero(bombero.id)}
                      style={{ borderRadius: '20px' }}
                      type="button"
                    >
                      {bombero.nombre_completo || bombero.username}
                    </Button>
                  );
                })}
                {bomberosPorCia(cia).length === 0 && <span className="text-muted small">Sin voluntarios</span>}
              </div>
            </div>
          ))}
        </Col>
        
        <Col md={6}>
          <h5 className="text-secondary mb-3"><FaShieldAlt className="me-2" />Otras Instituciones</h5>
          {['samu', 'carabineros', 'seguridad', 'conaf'].map(ent => (
            <Card key={ent} className={`mb-3 ${apoyoExterno[ent].activo ? 'border-success' : ''}`}>
              <Card.Header className="d-flex justify-content-between align-items-center py-2">
                <span className="text-capitalize">{ent}</span>
                <Form.Check type="switch" checked={apoyoExterno[ent].activo} onChange={() => handleExternoCheck(ent)} />
              </Card.Header>
              {apoyoExterno[ent].activo && (
                <Card.Body className="p-2">
                  <Row className="g-1">
                    <Col><Form.Control size="sm" placeholder="A Cargo" onChange={(e) => handleExternoChange(ent, 'a_cargo', e.target.value)} /></Col>
                    <Col><Form.Control size="sm" placeholder="Unidad/Móvil" onChange={(e) => handleExternoChange(ent, 'patente', e.target.value)} /></Col>
                    <Col><Form.Control size="sm" type="number" placeholder="Cant." onChange={(e) => handleExternoChange(ent, 'cantidad', e.target.value)} /></Col>
                  </Row>
                </Card.Body>
              )}
            </Card>
          ))}
        </Col>
      </Row>
    </div>
  );
}

export default Paso4Asistencia;
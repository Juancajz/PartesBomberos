import React from 'react';
import { Form, Card, Row, Col, InputGroup } from 'react-bootstrap';
import { FaUserInjured, FaCar } from 'react-icons/fa';

function Paso1Involucrados({ formulario, handleInputChange, listaBomberos, esVehicular }) {
  return (
    <div className="animacion-fade">
      <h5 className="text-secondary border-bottom pb-2">
        <FaUserInjured className="me-2" />Involucrados
      </h5>

      <Form.Group className="mb-3">
        <Form.Label className="fw-bold text-danger">Oficial a Cargo (*)</Form.Label>
        <Form.Select name="jefe_a_cargo" value={formulario.jefe_a_cargo} onChange={handleInputChange}>
          <option value="">Seleccione...</option>
          {listaBomberos.map(b => (
            <option key={b.id} value={b.id}>
              {b.nombre_completo} ({b.rango_texto} - {b.compania_texto})
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label className="fw-bold text-danger">Voluntario Anotador (*)</Form.Label>
        <Form.Select name="quien_anoto" value={formulario.quien_anoto} onChange={handleInputChange}>
          <option value="">Seleccione...</option>
          {listaBomberos.map(b => (
            <option key={b.id} value={b.id}>
              {b.nombre_completo} ({b.rango_texto} - {b.compania_texto})
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {esVehicular && (
        <Card className="mb-3 border-primary">
          <Card.Header className="bg-primary text-white py-1">
            <FaCar className="me-2" />Datos Vehículo
          </Card.Header>
          <Card.Body>
            <Row className="g-2 mb-2">
              <Col><Form.Control placeholder="Patente" name="vehiculo_patente" value={formulario.vehiculo_patente} onChange={handleInputChange} /></Col>
              <Col><Form.Control placeholder="Tipo" name="vehiculo_tipo" value={formulario.vehiculo_tipo} onChange={handleInputChange} /></Col>
            </Row>
            <Row className="g-2">
              <Col><Form.Control placeholder="Marca" name="vehiculo_marca" value={formulario.vehiculo_marca} onChange={handleInputChange} /></Col>
              <Col><Form.Control placeholder="Modelo" name="vehiculo_modelo" value={formulario.vehiculo_modelo} onChange={handleInputChange} /></Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      <Card className="bg-light border-0 mb-3">
        <Card.Body>
          <h6 className="text-primary fw-bold">Afectado</h6>
          <Row className="g-2">
            <Col md={3}><Form.Control placeholder="RUT" name="afectado_rut" value={formulario.afectado_rut} onChange={handleInputChange} maxLength={12} /></Col>
            <Col md={6}><Form.Control placeholder="Nombre" name="afectado_nombre" value={formulario.afectado_nombre} onChange={handleInputChange} /></Col>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>+56</InputGroup.Text>
                <Form.Control placeholder="912345678" name="afectado_telefono" value={formulario.afectado_telefono} onChange={handleInputChange} maxLength={9} />
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="bg-light border-0 mb-3">
        <Card.Body>
          <h6 className="text-secondary fw-bold">Denunciante</h6>
          <Row className="g-2">
            <Col md={4}><Form.Control placeholder="RUT" name="denunciante_rut" value={formulario.denunciante_rut} onChange={handleInputChange} maxLength={12} /></Col>
            <Col md={8}><Form.Control placeholder="Nombre" name="denunciante_nombre" value={formulario.denunciante_nombre} onChange={handleInputChange} /></Col>
          </Row>
        </Card.Body>
      </Card>

      <Form.Group className="mt-3">
        <Form.Label className="fw-bold">Descripción</Form.Label>
        <Form.Control as="textarea" rows={3} name="descripcion" value={formulario.descripcion} onChange={handleInputChange} />
      </Form.Group>
    </div>
  );
}

export default Paso1Involucrados;
import React from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import { FaClipboardList } from 'react-icons/fa';
import SelectorMapa from '../SelectorMapa'; // Ojo con la ruta, subimos un nivel

function Paso2Datos({ formulario, handleInputChange, subtiposDisponibles, mostrarMapa, setMostrarMapa, recibirCoordenadas, fechaHoy }) {
  return (
    <div className="animacion-fade">
      <h5 className="text-secondary border-bottom pb-2">
        <FaClipboardList className="me-2" />Datos Generales
      </h5>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Label>Fecha (*)</Form.Label>
          <Form.Control type="date" name="fecha" max={fechaHoy} value={formulario.fecha} onChange={handleInputChange} />
        </Col>
        <Col md={6}>
          <Form.Label>Hora Alarma (*)</Form.Label>
          <Form.Control type="time" name="hora" value={formulario.hora} onChange={handleInputChange} />
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Lugar (*)</Form.Label>
        <div className="d-flex gap-2 mb-2">
          <Form.Control value={formulario.lugar} name="lugar" onChange={handleInputChange} placeholder="Dirección..." />
          <Button
            type="button"
            variant={mostrarMapa ? "secondary" : "info"}
            onClick={() => setMostrarMapa(!mostrarMapa)}
            className="text-white"
          >
            {mostrarMapa ? "Cerrar" : "Mapa"}
          </Button>
        </div>
        {mostrarMapa && <SelectorMapa alSeleccionarUbicacion={recibirCoordenadas} />}
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Subtipo</Form.Label>
        <Form.Select name="subtipo" value={formulario.subtipo} onChange={handleInputChange} disabled={!subtiposDisponibles.length}>
          <option value="">{subtiposDisponibles.length ? "Seleccione..." : "Sin detalle"}</option>
          {subtiposDisponibles.map(s => (
            <option key={s.id} value={s.id}>{s.codigo_subtipo} - {s.descripcion}</option>
          ))}
        </Form.Select>
      </Form.Group>
    </div>
  );
}

export default Paso2Datos;
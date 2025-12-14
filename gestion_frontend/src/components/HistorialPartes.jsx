import { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Table, Badge, Button, Form, InputGroup, Modal, Row, Col, Card } from 'react-bootstrap';
import { FaSearch, FaEye, FaClipboardList, FaRegClock, FaUserTie, FaMapMarkerAlt, FaUsers, FaFire, FaFilePdf } from 'react-icons/fa';
// IMPORTAMOS LIBRERÍAS PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function HistorialPartes() {
  const [partes, setPartes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [parteSeleccionado, setParteSeleccionado] = useState(null);

  const handleClose = () => { setShowModal(false); setParteSeleccionado(null); };
  const handleShow = (parte) => { setParteSeleccionado(parte); setShowModal(true); };

  useEffect(() => { cargarPartes(); }, []);

  const cargarPartes = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/partes/');
      const ordenados = res.data.sort((a, b) => new Date(b.fecha_hora_emergencia) - new Date(a.fecha_hora_emergencia));
      setPartes(ordenados);
    } catch (error) { console.error("Error cargando historial:", error); }
  };

  const partesFiltrados = partes.filter(parte => 
    parte.lugar.toLowerCase().includes(busqueda.toLowerCase()) ||
    (parte.tipo_detalle?.codigo || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  const formatearFechaHora = (fechaISO) => {
    if (!fechaISO) return "N/A";
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-CL') + ' ' + fecha.toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'});
  };

  const getTiempos = (parte) => {
      if (!parte.asistencias_carros || parte.asistencias_carros.length === 0) {
          return { salida: '--:--', llegada: '--:--', control: '--:--', termino: '--:--' };
      }
      const t = parte.asistencias_carros[0];
      return {
          salida: t.hora_salida_cuartel ? t.hora_salida_cuartel.slice(0, 5) : '--:--',
          llegada: t.hora_llegada_emergencia ? t.hora_llegada_emergencia.slice(0, 5) : '--:--',
          control: t.hora_retirada_emergencia ? t.hora_retirada_emergencia.slice(0, 5) : '--:--',
          termino: t.hora_llegada_cuartel ? t.hora_llegada_cuartel.slice(0, 5) : '--:--'
      };
  };

  const filtrarBomberosPorCia = (parte, ciaKey) => {
      if (!parte || !parte.asistencias_bomberos) return [];
      return parte.asistencias_bomberos.filter(asist => 
          asist.bombero_detalle.compania === ciaKey
      );
  };

  // --- FUNCIÓN GENERADORA DE PDF (RESTAURADA) ---
  const generarPDF = () => {
      const doc = new jsPDF();
      const p = parteSeleccionado;
      const tiempos = getTiempos(p);

      // 1. ENCABEZADO
      doc.setFontSize(18);
      doc.setTextColor(220, 53, 69);
      doc.text("CUERPO DE BOMBEROS LAJA", 105, 20, null, null, "center");
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Informe de Emergencia N° ${p.id}`, 105, 30, null, null, "center");
      doc.line(20, 35, 190, 35);

      // 2. DATOS
      doc.setFontSize(10);
      doc.text(`Fecha: ${formatearFechaHora(p.fecha_hora_emergencia)}`, 20, 45);
      doc.text(`Clave: ${p.tipo_detalle?.codigo} - ${p.tipo_detalle?.descripcion}`, 110, 45);
      
      const lugarSplit = doc.splitTextToSize(`Lugar: ${p.lugar}`, 170);
      doc.text(lugarSplit, 20, 55);
      
      const descY = 55 + (lugarSplit.length * 5) + 5;
      doc.setFont(undefined, 'bold');
      doc.text("Descripción:", 20, descY);
      doc.setFont(undefined, 'normal');
      const descSplit = doc.splitTextToSize(p.descripcion || "Sin descripción", 170);
      doc.text(descSplit, 20, descY + 7);

      // 3. TIEMPOS
      const nextY = descY + 7 + (descSplit.length * 5) + 10;
      autoTable(doc, {
          startY: nextY,
          head: [['Salida', 'Llegada', 'Control', 'Término']],
          body: [[tiempos.salida, tiempos.llegada, tiempos.control, tiempos.termino]],
          theme: 'grid',
          headStyles: { fillColor: [220, 53, 69] }
      });

      // 4. PERSONAL
      const yMando = doc.lastAutoTable.finalY + 10;
      doc.text(`Oficial a Cargo: ${p.jefe_nombre || 'Sin registro'}`, 20, yMando);
      
      const asistenciaData = [];
      ['PRIMERA', 'SEGUNDA', 'TERCERA'].forEach(cia => {
          const vols = filtrarBomberosPorCia(p, cia);
          if (vols.length > 0) {
              asistenciaData.push([{ content: `${cia} COMPAÑÍA`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
              vols.forEach(v => {
                  asistenciaData.push([v.bombero_detalle.nombre_completo, v.bombero_detalle.rango_texto]);
              });
          }
      });

      if (asistenciaData.length > 0) {
          doc.text("Lista de Asistencia:", 20, yMando + 10);
          autoTable(doc, {
              startY: yMando + 15,
              head: [['Voluntario', 'Cargo']],
              body: asistenciaData,
              theme: 'striped',
          });
      }

      // 5. FIRMA
      const finalY = doc.lastAutoTable.finalY + 40;
      if (finalY < 270) {
          doc.line(70, finalY, 140, finalY);
          doc.text("Firma Oficial a Cargo", 105, finalY + 5, null, null, "center");
      }

      doc.save(`Parte_${p.id}.pdf`);
  };

  return (
    <Container className="mt-5 mb-5">
      <h2 className="mb-4 text-secondary fw-bold"><FaClipboardList className="me-2"/>Libro de Partes</h2>

      <InputGroup className="mb-4 shadow-sm">
        <InputGroup.Text className="bg-white border-end-0"><FaSearch className="text-muted"/></InputGroup.Text>
        <Form.Control placeholder="Buscar..." className="border-start-0" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </InputGroup>

      <Card className="shadow-sm border-0 rounded-3 overflow-hidden">
        <div className="table-responsive">
            <Table hover className="align-middle mb-0">
            <thead className="bg-light text-secondary">
                <tr>
                <th className="py-3">Fecha/Hora</th>
                <th className="py-3">Clave</th>
                <th className="py-3">Lugar</th>
                <th className="py-3">Oficial a Cargo</th>
                <th className="text-center py-3">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {partesFiltrados.map(parte => (
                <tr key={parte.id}>
                    <td className="fw-bold text-secondary">{formatearFechaHora(parte.fecha_hora_emergencia)}</td>
                    <td>
                        <Badge bg="danger">{parte.tipo_detalle?.codigo || "S/I"}</Badge>
                        <div className="small text-muted">{parte.tipo_detalle?.descripcion}</div>
                    </td>
                    <td>{parte.lugar}</td>
                    <td className="text-dark fw-bold">{parte.jefe_nombre || "Sin registro"}</td>
                    <td className="text-center">
                        <Button variant="outline-primary" size="sm" className="rounded-circle shadow-sm" onClick={() => handleShow(parte)} style={{width: 35, height: 35}}><FaEye /></Button>
                    </td>
                </tr>
                ))}
            </tbody>
            </Table>
        </div>
      </Card>

      {/* ================= MODAL DETALLE ================= */}
      <Modal show={showModal} onHide={handleClose} size="xl" centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title className="fw-bold">📌 Detalle del Parte: {parteSeleccionado?.tipo_detalle?.codigo}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light">
          {parteSeleccionado && (
            <Row>
                <Col lg={7}>
                    <div className="bg-white p-3 rounded shadow-sm h-100">
                        <h6 className="text-danger fw-bold border-bottom pb-2 mb-3"><FaClipboardList className="me-2"/>Datos Generales</h6>
                        <Row className="mb-3 g-2">
                            <Col md={6}><div className="text-muted small">ID Parte</div><div className="fw-bold">#{parteSeleccionado.id}</div></Col>
                            <Col md={6}><div className="text-muted small">Fecha</div><div className="fw-bold">{formatearFechaHora(parteSeleccionado.fecha_hora_emergencia)}</div></Col>
                            <Col md={12}><div className="text-muted small">Lugar</div><div className="fw-bold text-primary"><FaMapMarkerAlt className="me-1"/>{parteSeleccionado.lugar}</div></Col>
                            <Col md={6}><div className="text-muted small">Clave</div><Badge bg="danger">{parteSeleccionado.tipo_detalle?.codigo}</Badge> {parteSeleccionado.tipo_detalle?.descripcion}</Col>
                            <Col md={6}><div className="text-muted small">Detalle</div><div className="fw-bold">{parteSeleccionado.subtipo_detalle ? parteSeleccionado.subtipo_detalle.descripcion : "No especificado"}</div></Col>
                        </Row>

                        <h6 className="text-danger fw-bold border-bottom pb-2 mb-3"><FaClipboardList className="me-2"/>Descripción</h6>
                        <div className="p-3 bg-light rounded fst-italic text-secondary mb-4 border">"{parteSeleccionado.descripcion}"</div>

                        <h6 className="text-danger fw-bold border-bottom pb-2 mb-3"><FaRegClock className="me-2"/>Tiempos (Primer Carro)</h6>
                        <Row className="g-2 text-center mb-4">
                            {(() => { const t = getTiempos(parteSeleccionado); return (
                                <>
                                    <Col xs={3}><div className="small text-muted">Salida</div><Badge bg="secondary">{t.salida}</Badge></Col>
                                    <Col xs={3}><div className="small text-muted">Llegada</div><Badge bg="primary">{t.llegada}</Badge></Col>
                                    <Col xs={3}><div className="small text-muted">Control</div><Badge bg="success">{t.control}</Badge></Col>
                                    <Col xs={3}><div className="small text-muted">Término</div><Badge bg="dark">{t.termino}</Badge></Col>
                                </>
                            )})()}
                        </Row>

                        <h6 className="text-danger fw-bold border-bottom pb-2 mb-3"><FaUserTie className="me-2"/>Mando</h6>
                        <Row className="g-2">
                            <Col md={6}><div className="text-muted small">Oficial a Cargo</div><div className="fw-bold">{parteSeleccionado.jefe_nombre || "Sin registro"}</div></Col>
                            <Col md={6}><div className="text-muted small">Anotador</div><div className="fw-bold">{parteSeleccionado.anotador_nombre || "Sin registro"}</div></Col>
                        </Row>
                    </div>
                </Col>

                <Col lg={5}>
                    <div className="bg-white p-3 rounded shadow-sm h-100 border-start">
                        <h5 className="text-secondary fw-bold mb-4 text-center"><FaUsers className="me-2"/>Asistencia Personal</h5>
                        
                        {['PRIMERA', 'SEGUNDA', 'TERCERA'].map(cia => {
                            const voluntarios = filtrarBomberosPorCia(parteSeleccionado, cia);
                            return (
                                <div key={cia} className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center border-bottom border-danger pb-1 mb-2">
                                        <h6 className="text-danger fw-bold mb-0">{cia} COMPAÑÍA</h6>
                                        <Badge bg="danger" pill>{voluntarios.length}</Badge>
                                    </div>
                                    
                                    {voluntarios.length > 0 ? (
                                        <ul className="list-group list-group-flush small">
                                            {voluntarios.map((asist, idx) => (
                                                <li key={idx} className="list-group-item px-0 py-2 border-0">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <span><FaFire className="text-warning me-2"/>{asist.bombero_detalle.nombre_completo}</span>
                                                        <span className="text-dark fw-bold" style={{fontSize: '0.95rem'}}>{asist.bombero_detalle.rango_texto}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-muted small fst-italic ms-2">Sin asistencia registrada.</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Col>
            </Row>
          )}
        </Modal.Body>
        {/* BOTONES DEL PIE */}
        <Modal.Footer className="bg-light d-flex justify-content-between">
          {/* BOTÓN PDF */}
          <Button variant="danger" onClick={generarPDF}>
            <FaFilePdf className="me-2"/>Descargar PDF Oficial
          </Button>
          
          <Button variant="secondary" onClick={handleClose}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default HistorialPartes;
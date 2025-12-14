import { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Nav, Spinner, Modal, Form } from 'react-bootstrap';
import { 
    FaTint, FaTools, FaMedkit, FaHardHat, FaBroadcastTower, 
    FaBoxOpen, FaTruck, FaMinus, FaPlus, FaPlusCircle, FaFireExtinguisher, FaTrash, FaTree
} from 'react-icons/fa';
import Swal from 'sweetalert2';

function Inventario() {
  const [materiales, setMateriales] = useState([]);
  const [carros, setCarros] = useState([]);
  const [carroSeleccionado, setCarroSeleccionado] = useState(null); 
  const [cargando, setCargando] = useState(false);
  
  // ESTADO PARA EL FORMULARIO
  const [showModal, setShowModal] = useState(false);
  const [nuevoMaterial, setNuevoMaterial] = useState({
      nombre: '', 
      categoria: 'HERRAMIENTAS', 
      ubicacion: '', 
      cantidad: 1
  });

  const CATEGORIAS = [
      { clave: 'AGUA', nombre: 'Material de Agua' },
      { clave: 'RESCATE', nombre: 'Material de Rescate' },
      { clave: 'TRAUMA', nombre: 'Material Médico' },
      { clave: 'EPP', nombre: 'Protección Personal' },
      { clave: 'COMUNICACION', nombre: 'Comunicaciones' },
      { clave: 'HERRAMIENTAS', nombre: 'Herramientas' },
      { clave: 'OTRO', nombre: 'Otros' }
  ];

  const getIcono = (cat) => {
      switch(cat) {
          case 'AGUA': return <FaTint size={40} className="text-primary"/>;
          case 'RESCATE': return <FaTools size={40} className="text-warning"/>;
          case 'TRAUMA': return <FaMedkit size={40} className="text-danger"/>;
          case 'EPP': return <FaHardHat size={40} className="text-warning"/>;
          case 'COMUNICACION': return <FaBroadcastTower size={40} className="text-info"/>;
          case 'HERRAMIENTAS': return <FaFireExtinguisher size={40} className="text-danger"/>;
          default: return <FaBoxOpen size={40} className="text-secondary"/>;
      }
  };

  useEffect(() => { cargarCarros(); }, []);

  useEffect(() => {
      if (carroSeleccionado) { cargarMateriales(carroSeleccionado); } 
      else { setMateriales([]); }
  }, [carroSeleccionado]);

  const cargarCarros = async () => {
      try {
          const res = await axios.get('http://127.0.0.1:8000/api/carros/');
          setCarros(res.data);
          if(res.data.length > 0) setCarroSeleccionado(res.data[0].id);
      } catch (err) { console.error("Error cargando carros", err); }
  };

  const cargarMateriales = async (carroId) => {
      setCargando(true);
      try {
          const res = await axios.get(`http://127.0.0.1:8000/api/materiales/?carro=${carroId}`);
          setMateriales(res.data);
      } catch (err) { console.error("Error cargando inventario", err); }
      finally { setCargando(false); }
  };

  const actualizarCantidad = async (material, delta) => {
      const nuevaCantidad = material.cantidad + delta;
      if (nuevaCantidad < 0) return; 

      const listaOriginal = [...materiales];
      const listaActualizada = materiales.map(m => m.id === material.id ? {...m, cantidad: nuevaCantidad} : m);
      setMateriales(listaActualizada);

      try {
          await axios.patch(`http://127.0.0.1:8000/api/materiales/${material.id}/`, { cantidad: nuevaCantidad });
      } catch (error) {
          setMateriales(listaOriginal);
          Swal.fire('Error', 'No se pudo actualizar la cantidad', 'error');
      }
  };

  const eliminarMaterial = async (id, nombre) => {
      const confirmacion = await Swal.fire({
          title: '¿Eliminar equipo?',
          text: `Vas a borrar "${nombre}" permanentemente.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Sí, borrar',
          cancelButtonText: 'Cancelar'
      });

      if (!confirmacion.isConfirmed) return;

      try {
          await axios.delete(`http://127.0.0.1:8000/api/materiales/${id}/`);
          setMateriales(materiales.filter(m => m.id !== id));
          
          Swal.fire(
            'Eliminado',
            'El equipo ha sido retirado del inventario.',
            'success'
          );
      } catch (error) {
          console.error(error);
          Swal.fire('Error', 'No se pudo eliminar el equipo', 'error');
      }
  };

  const handleGuardarMaterial = async () => {
      if (!nuevoMaterial.nombre) return Swal.fire('Atención', 'Ponle un nombre al equipo', 'warning');

      try {
          await axios.post('http://127.0.0.1:8000/api/materiales/', {
              ...nuevoMaterial,
              carro: carroSeleccionado,
              estado: 'OPERATIVO'
          });
          
          Swal.fire({
              icon: 'success', 
              title: 'Guardado', 
              timer: 1000, 
              showConfirmButton: false
          });
          
          setShowModal(false);
          setNuevoMaterial({ nombre: '', categoria: 'HERRAMIENTAS', ubicacion: '', cantidad: 1 });
          cargarMateriales(carroSeleccionado); 
      } catch (error) {
          console.error(error);
          Swal.fire('Error', 'No se pudo guardar el material', 'error');
      }
  };

  const cargarPautaPredefinida = async (tipo) => {
      const confirmacion = await Swal.fire({
          title: `¿Cargar inventario de ${tipo}?`,
          text: "Se agregarán múltiples materiales automáticamente.",
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, cargar',
          confirmButtonColor: '#198754'
      });

      if (!confirmacion.isConfirmed) return;

      setCargando(true);
      try {
          await axios.post('http://127.0.0.1:8000/api/materiales/cargar_pauta/', {
              carro_id: carroSeleccionado,
              tipo_pauta: tipo
          });
          
          Swal.fire('Listo', 'Pauta cargada exitosamente', 'success');
          cargarMateriales(carroSeleccionado); 
      } catch (error) {
          Swal.fire('Error', 'Hubo un problema al cargar la pauta', 'error');
      } finally {
          setCargando(false);
      }
  };

  const carroActual = carros.find(c => c.id === carroSeleccionado);

  return (
    <Container className="mt-4 mb-5">
      {/* CABECERA: AHORA USA carroActual.nombre */}
      <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-dark fw-bold">
              <FaBoxOpen className="me-2"/>
              Inventario {carroActual ? `del ${carroActual.nombre}` : ''}
          </h2>
          {carroSeleccionado && (
              <Button variant="success" onClick={() => setShowModal(true)}>
                  <FaPlusCircle className="me-2"/>Nuevo Equipo
              </Button>
          )}
      </div>

      {/* TABS DE CARROS: AHORA USAN carro.nombre */}
      <Card className="shadow-sm border-0 mb-4 bg-white">
          <Card.Body className="p-2">
            <Nav variant="pills" className="justify-content-center gap-2">
                {carros.map(carro => (
                    <Nav.Item key={carro.id}>
                        <Nav.Link 
                            active={carroSeleccionado === carro.id}
                            onClick={() => setCarroSeleccionado(carro.id)}
                            className={carroSeleccionado === carro.id ? "bg-danger text-white fw-bold shadow" : "text-secondary fw-bold bg-light"}
                            style={{cursor: 'pointer', minWidth: '120px', textAlign: 'center'}}
                        >
                            <FaTruck className="me-2"/>{carro.nombre}
                        </Nav.Link>
                    </Nav.Item>
                ))}
            </Nav>
          </Card.Body>
      </Card>

      {/* CONTENIDO PRINCIPAL */}
      {cargando ? (
          <div className="text-center py-5"><Spinner animation="border" variant="danger" /></div>
      ) : (
          <Row className="g-3">
              {materiales.length === 0 ? (
                  <div className="text-center text-muted py-5 col-12 bg-light rounded border border-dashed">
                      <FaBoxOpen size={50} className="mb-3 text-secondary opacity-50"/>
                      <h4>Este carro está vacío</h4>
                      <p className="mb-4">Puedes agregar ítems manualmente o usar una carga rápida:</p>
                      
                      <div className="d-flex justify-content-center gap-3 flex-wrap">
                          <Button variant="outline-primary" onClick={() => cargarPautaPredefinida('BOMBA')}>
                              <FaTint className="me-2"/>Cargar Pauta de Agua
                          </Button>
                          <Button variant="outline-warning" className="text-dark" onClick={() => cargarPautaPredefinida('RESCATE')}>
                              <FaTools className="me-2"/>Cargar Pauta de Rescate
                          </Button>
                      </div>
                          <Button variant="outline-success" onClick={() => cargarPautaPredefinida('FORESTAL')}>
                            <FaTree className="me-2"/>Cargar Pauta Forestal
                          </Button>
                  </div>
              ) : (
                  materiales.map(item => (
                      <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
                          <Card className="h-100 shadow-sm border-0 position-relative">
                              <Button 
                                variant="link" 
                                className="position-absolute top-0 end-0 m-2 text-muted p-0"
                                style={{zIndex: 10}}
                                onClick={() => eliminarMaterial(item.id, item.nombre)}
                                title="Eliminar equipo"
                              >
                                  <FaTrash size={14} className="text-secondary hover-danger"/>
                              </Button>

                              <div style={{height: '5px', width: '100%', background: item.estado === 'OPERATIVO' ? '#198754' : '#dc3545'}}></div>
                              <Card.Body className="text-center d-flex flex-column pt-4">
                                  <div className="mb-3 mx-auto p-3 rounded-circle bg-light d-flex align-items-center justify-content-center" style={{width: 70, height: 70}}>
                                      {getIcono(item.categoria)}
                                  </div>
                                  <Card.Title className="fw-bold fs-6 mb-1">{item.nombre}</Card.Title>
                                  <p className="text-muted small mb-2">{item.ubicacion || "Sin ubicación"}</p>
                                  
                                  <div className="mt-auto d-flex justify-content-center align-items-center bg-light rounded-pill p-1 border">
                                      <Button variant="link" size="sm" className="text-danger" onClick={() => actualizarCantidad(item, -1)} disabled={item.cantidad <= 0}>
                                          <FaMinus/>
                                      </Button>
                                      <span className="mx-3 fw-bold">{item.cantidad}</span>
                                      <Button variant="link" size="sm" className="text-success" onClick={() => actualizarCantidad(item, 1)}>
                                          <FaPlus/>
                                      </Button>
                                  </div>
                              </Card.Body>
                          </Card>
                      </Col>
                  ))
              )}
          </Row>
      )}

      {/* MODAL AGREGAR: TITULO CORREGIDO */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton className="bg-success text-white">
              <Modal.Title>Agregar al {carroActual?.nombre}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
              <Form>
                  <Form.Group className="mb-3">
                      <Form.Label>Nombre del Equipo</Form.Label>
                      <Form.Control 
                        autoFocus
                        placeholder='Ej: Pitón, Hacha, Radio...'
                        value={nuevoMaterial.nombre}
                        onChange={(e) => setNuevoMaterial({...nuevoMaterial, nombre: e.target.value})}
                      />
                  </Form.Group>
                  <Row>
                      <Col>
                          <Form.Group className="mb-3">
                              <Form.Label>Categoría</Form.Label>
                              <Form.Select 
                                value={nuevoMaterial.categoria}
                                onChange={(e) => setNuevoMaterial({...nuevoMaterial, categoria: e.target.value})}
                              >
                                  {CATEGORIAS.map(c => <option key={c.clave} value={c.clave}>{c.nombre}</option>)}
                              </Form.Select>
                          </Form.Group>
                      </Col>
                      <Col>
                          <Form.Group className="mb-3">
                              <Form.Label>Cantidad</Form.Label>
                              <Form.Control type="number" min="1"
                                value={nuevoMaterial.cantidad}
                                onChange={(e) => setNuevoMaterial({...nuevoMaterial, cantidad: parseInt(e.target.value) || 0})}
                              />
                          </Form.Group>
                      </Col>
                  </Row>
                  <Form.Group>
                      <Form.Label>Ubicación</Form.Label>
                      <Form.Control 
                        placeholder='Ej: Cajonera 1, Techo...'
                        value={nuevoMaterial.ubicacion}
                        onChange={(e) => setNuevoMaterial({...nuevoMaterial, ubicacion: e.target.value})}
                      />
                  </Form.Group>
              </Form>
          </Modal.Body>
          <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button variant="success" onClick={handleGuardarMaterial}>Guardar Equipo</Button>
          </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Inventario;
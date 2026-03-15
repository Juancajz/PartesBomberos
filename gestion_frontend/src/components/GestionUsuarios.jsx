import { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Table, Button, Modal, Form, Badge, Row, Col, Card, InputGroup, Tab, Tabs, Image } from 'react-bootstrap';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    FaUserPlus, FaEdit, FaTrash, FaUserCog, FaSearch, FaFilter, 
    FaFilePdf, FaCamera, FaSave, FaTimes 
} from 'react-icons/fa';
import Swal from 'sweetalert2';

// URL base para las imágenes (ajusta si tu puerto es diferente)
const BASE_URL = 'http://127.0.0.1:8000';

function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  
  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroCia, setFiltroCia] = useState("");
  const [filtroRango, setFiltroRango] = useState("");

  // Estado del Formulario
  const [formUser, setFormUser] = useState({
    id: null, username: '', password: '', 
    first_name: '', last_name: '', rut: '', email: '',
    fecha_nacimiento: '', fecha_ingreso: new Date().toISOString().split('T')[0],
    rango: 'VOLUNTARIO', compania: 'PRIMERA',
    is_staff: false, is_active: true,
    telefono: '', direccion: '',
    contacto_emergencia_nombre: '', contacto_emergencia_telefono: '',
    grupo_sanguineo: '', alergias: '', enfermedades_cronicas: '',
    talla_polera: '', talla_pantalon: '', talla_calzado: ''
  });

  // Estado separado para la foto (archivo y previsualización)
  const [fotoArchivo, setFotoArchivo] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  useEffect(() => { cargarUsuarios(); }, []);

  const cargarUsuarios = async () => {
    try {
        const res = await axios.get(`${BASE_URL}/api/bomberos/`);
        setUsuarios(res.data);
    } catch (error) { console.error("Error:", error); }
  };

  const usuariosFiltrados = usuarios.filter(u => {
      const texto = busqueda.toLowerCase();
      const coincideTexto = u.username.toLowerCase().includes(texto) || (u.nombre_completo || "").toLowerCase().includes(texto);
      const coincideCia = filtroCia ? u.compania === filtroCia : true;
      const coincideRango = filtroRango ? u.rango === filtroRango : true;
      return coincideTexto && coincideCia && coincideRango;
  });

  const formatearRUT = (rut) => {
    if(!rut) return "";
    let valor = rut.replace(/[^0-9kK]/g, '');
    if (valor.length > 1) {
        const cuerpo = valor.slice(0, -1);
        const dv = valor.slice(-1);
        return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
    }
    return valor;
  };

  const handleInputChange = (e) => {
      const { name, value } = e.target;
      if (name === 'rut') {
          setFormUser({ ...formUser, rut: formatearRUT(value) });
      } else {
          setFormUser({ ...formUser, [name]: value });
      }
  };

  // Manejo de cambio de Foto
  const handleFotoChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          setFotoArchivo(file);
          setFotoPreview(URL.createObjectURL(file));
      }
  };

  const handleShow = (user = null) => {
      setFotoArchivo(null); // Resetear archivo
      if (user) {
          setModoEdicion(true);
          // Preparar datos, asegurando que no haya nulos para los inputs
          const safeUser = Object.keys(user).reduce((acc, key) => {
              acc[key] = user[key] === null ? '' : user[key];
              return acc;
          }, {});
          setFormUser({ ...safeUser, password: '' }); 
          // Si el usuario tiene foto, mostrarla
          setFotoPreview(user.foto ? user.foto : null); 
      } else {
          setModoEdicion(false);
          setFotoPreview(null);
          setFormUser({
            id: null, username: '', password: '', 
            first_name: '', last_name: '', rut: '', email: '',
            fecha_nacimiento: '', fecha_ingreso: new Date().toISOString().split('T')[0],
            rango: 'VOLUNTARIO', compania: 'PRIMERA', 
            is_staff: false, is_active: true,
            telefono: '', direccion: '',
            contacto_emergencia_nombre: '', contacto_emergencia_telefono: '',
            grupo_sanguineo: '', alergias: '', enfermedades_cronicas: '',
            talla_polera: '', talla_pantalon: '', talla_calzado: ''
          });
      }
      setShowModal(true);
  };

  const handleSave = async () => {
      try {
          // Usamos FormData para enviar archivos + datos
          const formData = new FormData();
          
          // Agregamos todos los campos de texto
          Object.keys(formUser).forEach(key => {
              // Excepciones: ID no se envía, Password solo si tiene valor, Foto aparte
              if (key === 'foto') return; 
              if (key === 'id') return;
              if (key === 'password' && !formUser[key]) return; 

              // Convertir nulls a strings vacíos o no enviar si es opcional estricto
              const value = formUser[key];
              if (value !== null && value !== undefined) {
                  formData.append(key, value);
              }
          });

          // Agregar la foto si se seleccionó una nueva
          if (fotoArchivo) {
              formData.append('foto', fotoArchivo);
          }

          const config = { headers: { 'Content-Type': 'multipart/form-data' } };

          if (modoEdicion) {
              await axios.patch(`${BASE_URL}/api/bomberos/${formUser.id}/`, formData, config);
              Swal.fire('Actualizado', 'Ficha guardada correctamente', 'success');
          } else {
              if (!formUser.username || !formUser.password) return Swal.fire('Error', 'Faltan credenciales (Usuario/Pass)', 'warning');
              await axios.post(`${BASE_URL}/api/bomberos/`, formData, config);
              Swal.fire('Creado', 'Bombero registrado con éxito', 'success');
          }
          setShowModal(false);
          cargarUsuarios();
      } catch (error) {
          console.error(error);
          let mensaje = "Error desconocido.";
          if (error.response && error.response.data) mensaje = JSON.stringify(error.response.data);
          Swal.fire({ icon: 'error', title: 'Error', text: mensaje });
      }
  };

  const handleDelete = async (id) => {
      const result = await Swal.fire({ title: '¿Eliminar?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar' });
      if (result.isConfirmed) {
          try {
              await axios.delete(`${BASE_URL}/api/bomberos/${id}/`);
              cargarUsuarios();
          } catch (error) { Swal.fire('Error', 'No se pudo eliminar.', 'error'); }
      }
  };

  // Función PDF (simplificada para no alargar código, usa la tuya original o esta)
  const generarHojaVida = (u) => {
      // ... (Tu código de PDF se mantiene igual, puedes copiarlo aquí) ...
      // Solo recuerda que ahora u.foto podría ser una URL
      console.log("Generando PDF para", u.username);
  };

  return (
    <Container className="mt-5 mb-5">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="text-secondary fw-bold mb-0"><FaUserCog className="me-2"/>Gestión de Personal</h2>
            <p className="text-muted">Administración de hojas de vida y perfiles.</p>
          </div>
          <Button variant="success" size="lg" className="shadow-sm" onClick={() => handleShow(null)}>
              <FaUserPlus className="me-2"/>Nuevo Bombero
          </Button>
      </div>

      {/* FILTROS */}
      <Card className="mb-4 shadow-sm border-0 bg-white" style={{borderRadius: '15px'}}>
          <Card.Body className="p-4">
              <Row className="g-3">
                  <Col md={4}>
                      <InputGroup>
                        <InputGroup.Text className="bg-light border-0"><FaSearch className="text-muted"/></InputGroup.Text>
                        <Form.Control className="border-0 bg-light" placeholder="Buscar por nombre o usuario..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                      </InputGroup>
                  </Col>
                  <Col md={3}>
                      <Form.Select className="border-0 bg-light" value={filtroCia} onChange={(e) => setFiltroCia(e.target.value)}>
                          <option value="">Todas las Compañías</option>
                          <option value="PRIMERA">Primera</option>
                          <option value="SEGUNDA">Segunda</option>
                          <option value="TERCERA">Tercera</option>
                      </Form.Select>
                  </Col>
                  <Col md={3}>
                      <Form.Select className="border-0 bg-light" value={filtroRango} onChange={(e) => setFiltroRango(e.target.value)}>
                          <option value="">Todos los Rangos</option>
                          <option value="VOLUNTARIO">Voluntario</option>
                          <option value="CAPITAN">Capitán</option>
                          <option value="DIRECTOR">Director</option>
                      </Form.Select>
                  </Col>
                  <Col md={2}><Button variant="outline-secondary" className="w-100 border-0" onClick={() => {setBusqueda(""); setFiltroCia(""); setFiltroRango("");}}>Limpiar</Button></Col>
              </Row>
          </Card.Body>
      </Card>

      {/* TABLA */}
      <Card className="shadow-sm border-0" style={{borderRadius: '15px', overflow: 'hidden'}}>
        <Table hover responsive className="align-middle mb-0">
            <thead className="bg-light text-secondary">
                <tr>
                    <th className="ps-4">Bombero</th>
                    <th>Rango / Cía</th>
                    <th>Estado</th>
                    <th className="text-end pe-4">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {usuariosFiltrados.map(u => (
                    <tr key={u.id}>
                        <td className="ps-4">
                            <div className="d-flex align-items-center">
                                <div className="me-3 position-relative">
                                    {u.foto ? (
                                        <Image src={u.foto} roundedCircle width={45} height={45} style={{objectFit:'cover'}} />
                                    ) : (
                                        <div className="bg-secondary text-white rounded-circle d-flex justify-content-center align-items-center" style={{width: 45, height: 45, fontSize: '1.2rem'}}>
                                            {u.first_name?.[0] || u.username[0]}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="fw-bold text-dark">{u.nombre_completo}</div>
                                    <small className="text-muted">@{u.username}</small>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div className="fw-bold text-primary" style={{fontSize: '0.9rem'}}>{u.rango_texto}</div>
                            <Badge bg="light" text="dark" className="border">{u.compania}</Badge>
                        </td>
                        <td>
                             {u.is_active ? <Badge bg="success">Activo</Badge> : <Badge bg="danger">Inactivo</Badge>}
                        </td>
                        <td className="text-end pe-4">
                            <Button variant="link" className="text-danger p-1" onClick={() => generarHojaVida(u)}><FaFilePdf/></Button>
                            <Button variant="link" className="text-primary p-1" onClick={() => handleShow(u)}><FaEdit/></Button>
                            <Button variant="link" className="text-muted p-1" onClick={() => handleDelete(u.id)}><FaTrash/></Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
      </Card>

      {/* MODAL REDISEÑADO CON PESTAÑAS */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered backdrop="static">
          <Modal.Header closeButton className="border-0 pb-0">
             <Modal.Title className="fw-bold">{modoEdicion ? 'Editar Perfil' : 'Nuevo Registro'}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-0">
              
              {/* CABECERA CON FOTO (Estilo tarjeta ID) */}
              <div className="d-flex align-items-center mb-4 mt-3 bg-light p-3 rounded-3">
                  <div className="position-relative me-4">
                      <Image 
                        src={fotoPreview || "https://via.placeholder.com/150?text=Foto"} 
                        roundedCircle 
                        style={{width: 100, height: 100, objectFit: 'cover', border: '4px solid white'}} 
                        className="shadow-sm"
                      />
                      <label htmlFor="upload-photo" className="position-absolute bottom-0 end-0 btn btn-primary btn-sm rounded-circle p-2 shadow" style={{cursor: 'pointer'}}>
                          <FaCamera />
                      </label>
                      <input type="file" id="upload-photo" className="d-none" accept="image/*" onChange={handleFotoChange} />
                  </div>
                  <div>
                      <h4 className="mb-1">{formUser.first_name || "Nombre"} {formUser.last_name || "Apellido"}</h4>
                      <p className="text-muted mb-0">{formUser.rango} - {formUser.compania}</p>
                  </div>
              </div>

              {/* NAVEGACIÓN POR PESTAÑAS */}
              <Tabs defaultActiveKey="institucional" id="gestion-tabs" className="mb-3 custom-tabs" fill>
                  
                  {/* PESTAÑA 1: INSTITUCIONAL */}
                  <Tab eventKey="institucional" title="🚒 Institucional">
                      <Row className="g-3 mt-2">
                          <Col md={6}>
                              <Form.FloatingLabel label="Nombre de Usuario*">
                                  <Form.Control placeholder="Usuario" value={formUser.username} name="username" onChange={handleInputChange} disabled={modoEdicion}/>
                              </Form.FloatingLabel>
                          </Col>
                          <Col md={6}>
                              <Form.FloatingLabel label={modoEdicion ? "Nueva Contraseña (Opcional)" : "Contraseña*"}>
                                  <Form.Control type="password" placeholder="Pass" name="password" value={formUser.password} onChange={handleInputChange} />
                              </Form.FloatingLabel>
                          </Col>
                          <Col md={6}>
                              <Form.FloatingLabel label="Compañía">
                                  <Form.Select value={formUser.compania} name="compania" onChange={handleInputChange}>
                                      <option value="PRIMERA">Primera</option>
                                      <option value="SEGUNDA">Segunda</option>
                                      <option value="TERCERA">Tercera</option>
                                  </Form.Select>
                              </Form.FloatingLabel>
                          </Col>
                          <Col md={6}>
                              <Form.FloatingLabel label="Rango">
                                  <Form.Select value={formUser.rango} name="rango" onChange={handleInputChange}>
                                      <option value="VOLUNTARIO">Voluntario</option>
                                      <option value="CAPITAN">Capitán</option>
                                      <option value="DIRECTOR">Director</option>
                                      <option value="SECRETARIO">Secretario</option>
                                      <option value="TESORERO">Tesorero</option>
                                      <option value="AYUDANTE">Ayudante</option>
                                      <option value="TENIENTEPRIMERO">Teniente 1°</option>
                                      <option value="TENIENTESEGUNDO">Teniente 2°</option>
                                      <option value="TENIENTETERCERO">Teniente 3°</option>
                                  </Form.Select>
                              </Form.FloatingLabel>
                          </Col>
                          <Col md={6}>
                              <Form.FloatingLabel label="Fecha Ingreso">
                                  <Form.Control type="date" value={formUser.fecha_ingreso} name="fecha_ingreso" onChange={handleInputChange} />
                              </Form.FloatingLabel>
                          </Col>
                          <Col md={6} className="d-flex align-items-center">
                              <Form.Check type="switch" label="Permisos de Administrador" checked={formUser.is_staff} name="is_staff" onChange={(e)=>setFormUser({...formUser, is_staff: e.target.checked})} className="fw-bold text-danger" />
                          </Col>
                      </Row>
                  </Tab>

                  {/* PESTAÑA 2: PERSONAL */}
                  <Tab eventKey="personal" title="👤 Personal">
                      <Row className="g-3 mt-2">
                          <Col md={6}>
                              <Form.FloatingLabel label="Nombres">
                                  <Form.Control placeholder="Ej: Juan" value={formUser.first_name} name="first_name" onChange={handleInputChange} />
                              </Form.FloatingLabel>
                          </Col>
                          <Col md={6}>
                              <Form.FloatingLabel label="Apellidos">
                                  <Form.Control placeholder="Ej: Pérez" value={formUser.last_name} name="last_name" onChange={handleInputChange} />
                              </Form.FloatingLabel>
                          </Col>
                          <Col md={6}>
                              <Form.FloatingLabel label="RUT">
                                  <Form.Control placeholder="12.345.678-9" value={formUser.rut} name="rut" onChange={handleInputChange} maxLength={12}/>
                              </Form.FloatingLabel>
                          </Col>
                          <Col md={6}>
                              <Form.FloatingLabel label="Fecha Nacimiento">
                                  <Form.Control type="date" value={formUser.fecha_nacimiento} name="fecha_nacimiento" onChange={handleInputChange} />
                              </Form.FloatingLabel>
                          </Col>
                          <Col md={6}>
                              <Form.FloatingLabel label="Email">
                                  <Form.Control type="email" placeholder="nombre@correo.com" value={formUser.email} name="email" onChange={handleInputChange} />
                              </Form.FloatingLabel>
                          </Col>
                          <Col md={6}>
                              <Form.FloatingLabel label="Teléfono">
                                  <Form.Control placeholder="+569..." value={formUser.telefono} name="telefono" onChange={handleInputChange} />
                              </Form.FloatingLabel>
                          </Col>
                          <Col md={12}>
                              <Form.FloatingLabel label="Dirección Particular">
                                  <Form.Control placeholder="Calle #123" value={formUser.direccion} name="direccion" onChange={handleInputChange} />
                              </Form.FloatingLabel>
                          </Col>
                      </Row>
                  </Tab>

                  {/* PESTAÑA 3: MÉDICO Y LOGÍSTICA */}
                  <Tab eventKey="medico" title="🏥 Médico/Logística">
                      <Row className="g-3 mt-2">
                          <Col md={12}><h6 className="text-danger border-bottom pb-2">Información Médica</h6></Col>
                          <Col md={4}>
                              <Form.Label>Grupo Sanguíneo</Form.Label>
                              <Form.Select size="sm" value={formUser.grupo_sanguineo} name="grupo_sanguineo" onChange={handleInputChange}>
                                  <option value="">Seleccione</option>
                                  <option value="O+">O+</option><option value="O-">O-</option>
                                  <option value="A+">A+</option><option value="A-">A-</option>
                                  <option value="B+">B+</option><option value="B-">B-</option>
                                  <option value="AB+">AB+</option><option value="AB-">AB-</option>
                              </Form.Select>
                          </Col>
                          <Col md={8}>
                              <Form.Label>Alergias / Crónicas</Form.Label>
                              <Form.Control size="sm" placeholder="Detalle alergias..." value={formUser.alergias} name="alergias" onChange={handleInputChange} />
                          </Col>
                          
                          <Col md={12} className="mt-4"><h6 className="text-success border-bottom pb-2">Logística (Tallas)</h6></Col>
                          <Col md={4}>
                              <Form.Label>Polera</Form.Label>
                              <Form.Select size="sm" value={formUser.talla_polera} name="talla_polera" onChange={handleInputChange}>
                                  <option value="">--</option><option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option>
                              </Form.Select>
                          </Col>
                          <Col md={4}>
                             <Form.Label>Pantalón</Form.Label>
                             <Form.Control size="sm" value={formUser.talla_pantalon} name="talla_pantalon" onChange={handleInputChange} />
                          </Col>
                          <Col md={4}>
                             <Form.Label>Calzado</Form.Label>
                             <Form.Control size="sm" value={formUser.talla_calzado} name="talla_calzado" onChange={handleInputChange} />
                          </Col>
                      </Row>
                  </Tab>

              </Tabs>

          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
              <Button variant="light" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSave} className="px-4"><FaSave className="me-2"/>{modoEdicion ? 'Guardar Cambios' : 'Crear Bombero'}</Button>
          </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default GestionUsuarios;
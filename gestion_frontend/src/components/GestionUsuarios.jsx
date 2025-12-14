import { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Table, Button, Modal, Form, Badge, Row, Col, Card, InputGroup } from 'react-bootstrap';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    FaUserPlus, FaEdit, FaTrash, FaUserCog, FaSearch, FaFilter, 
    FaIdCard, FaCalendarAlt, FaEnvelope, FaUserTie, FaPhone, 
    FaMapMarkerAlt, FaHeartbeat, FaTshirt, FaFirstAid, FaFilePdf 
} from 'react-icons/fa';
import Swal from 'sweetalert2';

function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  
  const [busqueda, setBusqueda] = useState("");
  const [filtroCia, setFiltroCia] = useState("");
  const [filtroRango, setFiltroRango] = useState("");

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

  useEffect(() => { cargarUsuarios(); }, []);

  const cargarUsuarios = async () => {
    try {
        const res = await axios.get('http://127.0.0.1:8000/api/bomberos/');
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

  // ---GENERAR PDF ---
  const generarHojaVida = (u) => {
      const doc = new jsPDF();
      
      // 1. ENCABEZADO
      doc.setFillColor(220, 53, 69); 
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("HOJA DE VIDA INSTITUCIONAL", 105, 20, null, null, "center");
      doc.setFontSize(12);
      doc.text(`Cuerpo de Bomberos LAJA - ${u.compania || 'Sin Compañía'}`, 105, 30, null, null, "center");
      doc.setTextColor(0, 0, 0);
      const check = (dato) => dato || "No registrado";

      // 2. DATOS PERSONALES
      doc.setFontSize(14);
      doc.setTextColor(220, 53, 69);
      doc.text("1. INFORMACIÓN PERSONAL", 14, 55);
      
      autoTable(doc, {
          startY: 60,
          head: [['Dato', 'Detalle', 'Dato', 'Detalle']],
          body: [
              ['Nombre Completo', u.nombre_completo, 'RUT', formatearRUT(u.rut)],
              ['Fecha Nacimiento', check(u.fecha_nacimiento), 'Edad', check(u.edad)],
              ['Email', check(u.email), 'Teléfono', check(u.telefono)],
              ['Dirección', check(u.direccion), 'Usuario Sistema', u.username]
          ],
          theme: 'grid',
          headStyles: { fillColor: [50, 50, 50] },
          columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } }
      });

      // 3. DATOS INSTITUCIONALES
      doc.text("2. ANTECEDENTES BOMBERILES", 14, doc.lastAutoTable.finalY + 15);
      
      autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [['Dato', 'Detalle', 'Dato', 'Detalle']],
          body: [
              ['Compañía', check(u.compania), 'Rango Actual', check(u.rango_texto)],
              ['Fecha Ingreso', check(u.fecha_ingreso), 'Estado', u.is_active ? 'Activo' : 'Inactivo'],
              ['Permisos Admin', u.is_staff ? 'SI' : 'NO', '', '']
          ],
          theme: 'grid',
          headStyles: { fillColor: [50, 50, 50] },
          columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } }
      });

      // 4. DATOS MÉDICOS Y EMERGENCIA
      doc.text("3. INFORMACIÓN MÉDICA Y EMERGENCIA", 14, doc.lastAutoTable.finalY + 15);
      
      autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          body: [
              ['Grupo Sanguíneo', check(u.grupo_sanguineo)],
              ['Alergias', check(u.alergias)],
              ['Enfermedades Crónicas', check(u.enfermedades_cronicas)],
              ['CONTACTO EMERGENCIA', `${check(u.contacto_emergencia_nombre)} (${check(u.contacto_emergencia_telefono)})`]
          ],
          theme: 'striped',
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
      });

      // 5. LOGÍSTICA
      doc.text("4. TALLAS Y LOGÍSTICA", 14, doc.lastAutoTable.finalY + 15);
      
      autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [['Polera/Casaca', 'Pantalón', 'Calzado']],
          body: [[check(u.talla_polera), check(u.talla_pantalon), check(u.talla_calzado)]],
          theme: 'grid',
          headStyles: { fillColor: [220, 53, 69] },
          styles: { halign: 'center' }
      });

      const pageCount = doc.internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(10);
          doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 285);
          doc.text(`Página ${i} de ${pageCount}`, 190, 285, null, null, "right");
      }

      doc.save(`HojaVida_${u.rut || u.username}.pdf`);
  };

  const handleShow = (user = null) => {
      if (user) {
          setModoEdicion(true);
          const safeUser = Object.keys(user).reduce((acc, key) => {
              acc[key] = user[key] === null ? '' : user[key];
              return acc;
          }, {});
          setFormUser({ ...safeUser, password: '' }); 
      } else {
          setModoEdicion(false);
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
          const payload = { ...formUser };
          const camposOpcionales = ['password', 'email', 'rut', 'telefono', 'direccion', 'contacto_emergencia_nombre', 'contacto_emergencia_telefono', 'grupo_sanguineo', 'alergias', 'enfermedades_cronicas', 'talla_polera', 'talla_pantalon', 'talla_calzado', 'fecha_nacimiento'];
          
          camposOpcionales.forEach(campo => {
              if (!payload[campo]) {
                  if (campo === 'password' && !modoEdicion) return; 
                  if (campo === 'password' && modoEdicion) delete payload.password; 
                  else payload[campo] = null;
              }
          });

          if (modoEdicion) {
              await axios.put(`http://127.0.0.1:8000/api/bomberos/${formUser.id}/`, payload);
              Swal.fire('Actualizado', 'Ficha guardada', 'success');
          } else {
              if (!formUser.username || !formUser.password) return Swal.fire('Error', 'Faltan credenciales', 'warning');
              await axios.post('http://127.0.0.1:8000/api/bomberos/', payload);
              Swal.fire('Creado', 'Bombero creado', 'success');
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
      const result = await Swal.fire({ title: '¿Eliminar?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí' });
      if (result.isConfirmed) {
          try {
              await axios.delete(`http://127.0.0.1:8000/api/bomberos/${id}/`);
              cargarUsuarios();
          } catch (error) { Swal.fire('Error', 'No se pudo eliminar.', 'error'); }
      }
  };

  return (
    <Container className="mt-5 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-secondary fw-bold"><FaUserCog className="me-2"/>Hoja de Vida del Personal</h2>
          <Button variant="success" onClick={() => handleShow(null)}><FaUserPlus className="me-2"/>Nuevo Bombero</Button>
      </div>

      <Card className="mb-4 shadow-sm border-0 bg-light">
          <Card.Body>
              <Row className="g-2">
                  <Col md={4}><InputGroup><InputGroup.Text className="bg-white"><FaSearch/></InputGroup.Text><Form.Control placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></InputGroup></Col>
                  <Col md={3}><InputGroup><InputGroup.Text className="bg-white"><FaFilter/></InputGroup.Text><Form.Select value={filtroCia} onChange={(e) => setFiltroCia(e.target.value)}><option value="">Todas las Compañías</option><option value="PRIMERA">Primera</option><option value="SEGUNDA">Segunda</option><option value="TERCERA">Tercera</option></Form.Select></InputGroup></Col>
                  <Col md={3}><Form.Select value={filtroRango} onChange={(e) => setFiltroRango(e.target.value)}><option value="">Todos los Rangos</option><option value="VOLUNTARIO">Voluntario</option><option value="CAPITAN">Capitán</option><option value="DIRECTOR">Director</option></Form.Select></Col>
                  <Col md={2}><Button variant="outline-secondary" className="w-100" onClick={() => {setBusqueda(""); setFiltroCia(""); setFiltroRango("");}}>Limpiar</Button></Col>
              </Row>
          </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Table hover responsive className="align-middle mb-0">
            <thead className="bg-light">
                <tr><th>Usuario</th><th>Nombre Completo</th><th>Compañía</th><th>Rango</th><th>Acciones</th></tr>
            </thead>
            <tbody>
                {usuariosFiltrados.map(u => (
                    <tr key={u.id}>
                        <td className="fw-bold">{u.username}</td>
                        <td>{u.nombre_completo}</td>
                        <td><Badge bg="secondary">{u.compania}</Badge></td>
                        <td>{u.rango_texto || u.rango}</td>
                        <td>
                            <Button variant="outline-danger" size="sm" className="me-2" title="Descargar PDF" onClick={() => generarHojaVida(u)}><FaFilePdf/></Button>
                            <Button variant="outline-primary" size="sm" className="me-2" title="Editar" onClick={() => handleShow(u)}><FaEdit/></Button>
                            <Button variant="outline-dark" size="sm" title="Eliminar" onClick={() => handleDelete(u.id)}><FaTrash/></Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
          <Modal.Header closeButton className="bg-primary text-white">
              <Modal.Title>{modoEdicion ? 'Editar Hoja de Vida' : 'Crear Ficha de Bombero'}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-light">
              <Form>
                  <Card className="mb-3 shadow-sm border-0"><Card.Header className="bg-white fw-bold text-primary"><FaUserTie className="me-2"/>Datos Institucionales</Card.Header><Card.Body><Row className="mb-3"><Col md={3}><Form.Label>Usuario*</Form.Label><Form.Control value={formUser.username} name="username" onChange={handleInputChange} /></Col><Col md={3}><Form.Label>Contraseña</Form.Label><Form.Control type="password" name="password" value={formUser.password} onChange={handleInputChange} /></Col><Col md={3}><Form.Label>Compañía</Form.Label><Form.Select value={formUser.compania} name="compania" onChange={handleInputChange}><option value="PRIMERA">Primera</option><option value="SEGUNDA">Segunda</option><option value="TERCERA">Tercera</option></Form.Select></Col><Col md={3}><Form.Label>Rango</Form.Label><Form.Select value={formUser.rango} name="rango" onChange={handleInputChange}><option value="VOLUNTARIO">Voluntario</option><option value="TENIENTEPRIMERO">Teniente Primero</option><option value="TENIENTESEGUNDO">Teniente Segundo</option><option value="TENIENTETERCERO">Teniente Tercero</option><option value="CAPITAN">Capitán</option><option value="DIRECTOR">Director</option><option value="SECRETARIO">Secretario</option><option value="TESORERO">Tesorero</option><option value="AYUDANTE">Ayudante</option></Form.Select></Col></Row><Row><Col md={3}><Form.Label>Fecha Ingreso</Form.Label><Form.Control type="date" value={formUser.fecha_ingreso} name="fecha_ingreso" onChange={handleInputChange} /></Col><Col md={9}><Form.Check type="switch" label="¿Es Administrador?" checked={formUser.is_staff} name="is_staff" onChange={(e)=>setFormUser({...formUser, is_staff: e.target.checked})} className="mt-4 text-danger fw-bold" /></Col></Row></Card.Body></Card>
                  
                  <Card className="mb-3 shadow-sm border-0"><Card.Header className="bg-white fw-bold text-primary"><FaIdCard className="me-2"/>Información Personal</Card.Header><Card.Body><Row className="mb-3"><Col md={4}><Form.Label>Nombres</Form.Label><Form.Control value={formUser.first_name} name="first_name" onChange={handleInputChange} /></Col><Col md={4}><Form.Label>Apellidos</Form.Label><Form.Control value={formUser.last_name} name="last_name" onChange={handleInputChange} /></Col><Col md={4}><Form.Label>RUT</Form.Label><Form.Control value={formUser.rut} name="rut" onChange={handleInputChange} maxLength={12}/></Col></Row><Row className="mb-3"><Col md={4}><Form.Label>Email</Form.Label><Form.Control type="email" value={formUser.email} name="email" onChange={handleInputChange} /></Col><Col md={4}><Form.Label>Teléfono</Form.Label><Form.Control value={formUser.telefono} name="telefono" onChange={handleInputChange} /></Col><Col md={4}><Form.Label>Fecha Nacimiento</Form.Label><Form.Control type="date" value={formUser.fecha_nacimiento} name="fecha_nacimiento" onChange={handleInputChange} /></Col></Row><Row><Col md={12}><Form.Label>Dirección</Form.Label><Form.Control value={formUser.direccion} name="direccion" onChange={handleInputChange} /></Col></Row></Card.Body></Card>

                  <Row><Col md={6}><Card className="h-100 shadow-sm border-0"><Card.Header className="bg-white fw-bold text-danger"><FaHeartbeat className="me-2"/>Datos Médicos</Card.Header><Card.Body><Row className="mb-2"><Col><Form.Label>Grupo Sanguíneo</Form.Label><Form.Select value={formUser.grupo_sanguineo} name="grupo_sanguineo" onChange={handleInputChange}><option value="">--</option><option value="O+">O+</option><option value="O-">O-</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option></Form.Select></Col></Row><Row className="mb-2"><Col><Form.Label>Alergias</Form.Label><Form.Control as="textarea" rows={2} value={formUser.alergias} name="alergias" onChange={handleInputChange} /></Col></Row><Row className="mb-3"><Col><Form.Label>Enfermedades Crónicas</Form.Label><Form.Control size="sm" value={formUser.enfermedades_cronicas} name="enfermedades_cronicas" onChange={handleInputChange} /></Col></Row><div className="bg-danger bg-opacity-10 p-2 rounded"><small className="fw-bold text-danger d-block mb-1"><FaFirstAid className="me-1"/>Emergencia avisar a:</small><Row><Col md={7}><Form.Control size="sm" placeholder="Nombre" value={formUser.contacto_emergencia_nombre} name="contacto_emergencia_nombre" onChange={handleInputChange} /></Col><Col md={5}><Form.Control size="sm" placeholder="Teléfono" value={formUser.contacto_emergencia_telefono} name="contacto_emergencia_telefono" onChange={handleInputChange} /></Col></Row></div></Card.Body></Card></Col><Col md={6}><Card className="h-100 shadow-sm border-0"><Card.Header className="bg-white fw-bold text-success"><FaTshirt className="me-2"/>Logística</Card.Header><Card.Body><Row className="mb-3"><Col><Form.Label>Talla Polera</Form.Label><Form.Select value={formUser.talla_polera} name="talla_polera" onChange={handleInputChange}><option value="">--</option><option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option></Form.Select></Col></Row><Row className="mb-3"><Col><Form.Label>Talla Pantalón</Form.Label><Form.Control value={formUser.talla_pantalon} name="talla_pantalon" onChange={handleInputChange} /></Col></Row><Row><Col><Form.Label>Talla Calzado</Form.Label><Form.Control value={formUser.talla_calzado} name="talla_calzado" onChange={handleInputChange} /></Col></Row></Card.Body></Card></Col></Row>
              </Form>
          </Modal.Body>
          <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSave}>{modoEdicion ? 'Guardar' : 'Crear'}</Button>
          </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default GestionUsuarios;
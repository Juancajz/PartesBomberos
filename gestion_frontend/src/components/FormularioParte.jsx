import { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Container, Row, Col, Card, InputGroup } from 'react-bootstrap';
import SelectorMapa from './SelectorMapa';
import SelectorCarros from './SelectorCarros';
import Swal from 'sweetalert2';
import { 
    FaClipboardList, FaUserInjured, FaTruck, FaChevronRight, FaChevronLeft, 
    FaTachometerAlt, FaUserSecret, FaUsers, FaHospital, FaShieldAlt, FaBuilding, FaTree, FaCar
} from 'react-icons/fa';

function FormularioParte({ tipoPreseleccionado }) {
  
  // --- ESTADOS ---
  const [Pagina, setPagina] = useState(1);
  const [subtiposDisponibles, setSubtiposDisponibles] = useState([]);
  const [listaBomberos, setListaBomberos] = useState([]); 
  const [carrosSeleccionados, setCarrosSeleccionados] = useState([]);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [esVehicular, setEsVehicular] = useState(false);


  const fechaHoy = new Date().toISOString().split('T')[0];

  // ESTADOS ASISTENCIA
  const [asistenciaBomberos, setAsistenciaBomberos] = useState([]);
  const [apoyoExterno, setApoyoExterno] = useState({
    samu: { activo: false, a_cargo: '', patente: '', cantidad: '' },
    carabineros: { activo: false, a_cargo: '', patente: '', cantidad: '' },
    seguridad: { activo: false, a_cargo: '', patente: '', cantidad: '' },
    conaf: { activo: false, a_cargo: '', patente: '', cantidad: '' },
  });

  const [formulario, setFormulario] = useState({
    // General
    fecha: fechaHoy,
    hora: new Date().toTimeString().slice(0, 5),
    lugar: '',
    tipo: tipoPreseleccionado ? tipoPreseleccionado.id : '',
    subtipo: '',
    // Personas
    jefe_a_cargo: '',
    quien_anoto: '',
    afectado_rut: '',
    afectado_nombre: '',
    afectado_telefono: '',
    denunciante_rut: '',
    denunciante_nombre: '',
    descripcion: '',
    // Vehículo
    vehiculo_patente: '',
    vehiculo_marca: '',
    vehiculo_modelo: '',
    vehiculo_color: '',
    vehiculo_tipo: '',
    // Logística
    maquinista: '',
    hora_salida_cuartel: '',
    hora_llegada_emergencia: '',
    hora_control_emergencia: '',
    hora_extincion: '', 
    hora_termino_emergencia: '',
    km_salida: '',
    km_llegada: '',
  });

  // --- CARGA DE DATOS ---
  useEffect(() => {
    if (tipoPreseleccionado) {
        const cod = tipoPreseleccionado.codigo;
        if (cod.startsWith('10-1') || cod.startsWith('10-4')) setEsVehicular(true);
        else setEsVehicular(false);
    }
    axios.get('http://127.0.0.1:8000/api/subtipos-emergencia/').then(res => {
        if (tipoPreseleccionado) setSubtiposDisponibles(res.data.filter(s => s.tipo_padre === tipoPreseleccionado.id));
    });
    axios.get('http://127.0.0.1:8000/api/bomberos/').then(res => setListaBomberos(res.data));
  }, [tipoPreseleccionado]);

  // --- Vaaidacines reglas rut nombre km ---

  // 1. Formateador de RUT (12.345.678-9)
  const formatearRUT = (rut) => {
    let valor = rut.replace(/[^0-9kK]/g, ''); 
    if (valor.length > 1) {
        const cuerpo = valor.slice(0, -1);
        const dv = valor.slice(-1);
        const cuerpoFormato = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return `${cuerpoFormato}-${dv}`;
    }
    return valor;
  };

  // 2. Reglas
  const handleInputChange = (e) => {
      const { name, value } = e.target;

      // REGLA: Solo letras 
      if (name === 'afectado_nombre' || name === 'denunciante_nombre') {
          // Regex: Solo letras, espacios y tildes (áéíóúñ)
          if (value !== '' && !/^[a-zA-Z\u00C0-\u00FF\s]*$/.test(value)) return;
      }

      // REGLA: Teléfono
      if (name === 'afectado_telefono') {
          if (value !== '' && !/^\d*$/.test(value)) return;
          if (value.length > 9) return;
      }

      // REGLA: Kilometraje 
      if (name === 'km_salida' || name === 'km_llegada') {
          if (value < 0) return;
      }

      // REGLA: RUT 
      if (name.includes('rut')) {
          const rutFormateado = formatearRUT(value);
          setFormulario({ ...formulario, [name]: rutFormateado });
          return;
      }

      setFormulario({ ...formulario, [name]: value });
  };

  const recibirCoordenadas = (dir) => setFormulario({ ...formulario, lugar: dir });
  const toggleBombero = (id) => {
    if (asistenciaBomberos.includes(id)) setAsistenciaBomberos(asistenciaBomberos.filter(bId => bId !== id));
    else setAsistenciaBomberos([...asistenciaBomberos, id]);
  };
  const handleExternoCheck = (ent) => setApoyoExterno({ ...apoyoExterno, [ent]: { ...apoyoExterno[ent], activo: !apoyoExterno[ent].activo } });
  const handleExternoChange = (ent, field, val) => setApoyoExterno({ ...apoyoExterno, [ent]: { ...apoyoExterno[ent], [field]: val } });

  // --- NAVEGACIÓN ---
  const mostrarError = (msg) => Swal.fire({ icon: 'warning', title: 'Faltan Datos', text: msg, confirmButtonColor: '#dc3545' });

  const irAlPagina = (nuevoPagina) => {
    if (Pagina === 1 && nuevoPagina > 1) {
        if (!formulario.jefe_a_cargo) return mostrarError("El Oficial a Cargo es obligatorio.");
        if (!formulario.quien_anoto) return mostrarError("El Voluntario Anotador es obligatorio.");
        if (formulario.afectado_rut && formulario.afectado_rut.length < 8) return mostrarError("El RUT del afectado parece incompleto.");
    }
    if (Pagina === 2 && nuevoPagina > 2) {
        if (!formulario.lugar || !formulario.fecha) return mostrarError("Fecha y Lugar son obligatorios.");
    }
    if (Pagina === 3 && nuevoPagina > 3) {
        if (carrosSeleccionados.length === 0) return mostrarError("Selecciona al menos un Carro.");
        if (!formulario.maquinista) return mostrarError("Falta el Maquinista.");
        if (!formulario.hora_salida_cuartel || !formulario.hora_llegada_emergencia) return mostrarError("Hora de Salida y Llegada son obligatorias.");
        if (!formulario.km_salida || !formulario.km_llegada) return mostrarError("Falta Kilometraje.");
    }
    setPagina(nuevoPagina);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    if(e) e.preventDefault();
    const limpiar = (v) => (v === "" || v === "0") ? null : v;
    

    let telefonoFinal = formulario.afectado_telefono;
    if (telefonoFinal && !telefonoFinal.startsWith('+56')) {
        telefonoFinal = '+56' + telefonoFinal;
    }

    const payload = {
        fecha_hora_emergencia: `${formulario.fecha}T${formulario.hora}:00`,
        lugar: formulario.lugar,
        descripcion: formulario.descripcion || "Sin descripción.", 
        tipo_emergencia: formulario.tipo,
        subtipo_emergencia: limpiar(formulario.subtipo), 
        quien_anoto: formulario.quien_anoto,
        jefe_a_cargo: formulario.jefe_a_cargo,
        
        afectado_rut: formulario.afectado_rut,
        afectado_nombre: formulario.afectado_nombre,
        afectado_telefono: telefonoFinal, 
        denunciante_rut: formulario.denunciante_rut,
        denunciante_nombre: formulario.denunciante_nombre,

        vehiculo_patente: formulario.vehiculo_patente,
        vehiculo_marca: formulario.vehiculo_marca,
        vehiculo_modelo: formulario.vehiculo_modelo,
        vehiculo_color: formulario.vehiculo_color,
        vehiculo_tipo: formulario.vehiculo_tipo,

        carros_ids: carrosSeleccionados,
        bomberos_ids: asistenciaBomberos,
        maquinista_id: limpiar(formulario.maquinista),
        
        hora_salida_cuartel: limpiar(formulario.hora_salida_cuartel),
        hora_llegada_emergencia: limpiar(formulario.hora_llegada_emergencia),
        hora_control_emergencia: limpiar(formulario.hora_control_emergencia),
        hora_extincion: limpiar(formulario.hora_extincion),
        hora_llegada_cuartel: limpiar(formulario.hora_termino_emergencia),
        km_salida: limpiar(formulario.km_salida) || 0,
        km_llegada: limpiar(formulario.km_llegada) || 0,
        apoyo_externo: apoyoExterno 
    };

    try {
        Swal.fire({ title: 'Guardando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        await axios.post('http://127.0.0.1:8000/api/partes/', payload);
        Swal.fire({ icon: 'success', title: '¡Parte Guardado!', confirmButtonColor: '#198754' }).then(() => window.location.reload());
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Revisa la consola.', confirmButtonColor: '#dc3545' });
    }
  };

  const bomberosPorCia = (cia) => listaBomberos.filter(b => b.compania === cia);

  return (
    <Container className="mt-4 mb-5">
      <Card className="shadow border-0">
        <div className="bg-danger text-white p-3 d-flex justify-content-between align-items-center rounded-top">
            <h5 className="mb-0 fw-bold">🔥 Parte: {tipoPreseleccionado.codigo}</h5>
            <span className="badge bg-white text-danger fs-6">Pagina {Pagina} de 4</span>
        </div>

        <Card.Body className="p-4">
          <Form>
            {/* Pagina 1 */}
            {Pagina === 1 && (
                <div className="animacion-fade">
                    <h5 className="text-secondary border-bottom pb-2"><FaUserInjured className="me-2"/>Involucrados</h5>
                    <Form.Group className="mb-3"><Form.Label className="fw-bold text-danger">Oficial a Cargo (*)</Form.Label><Form.Select name="jefe_a_cargo" value={formulario.jefe_a_cargo} onChange={handleInputChange}><option value="">Seleccione...</option>{listaBomberos.map(b=><option key={b.id} value={b.id}>{b.nombre_completo} ({b.rango_texto} - {b.compania_texto})</option>)}</Form.Select></Form.Group>
                    <Form.Group className="mb-4"><Form.Label className="fw-bold text-danger">Voluntario Anotador (*)</Form.Label><Form.Select name="quien_anoto" value={formulario.quien_anoto} onChange={handleInputChange}><option value="">Seleccione...</option>{listaBomberos.map(b=><option key={b.id} value={b.id}>{b.nombre_completo} ({b.rango_texto} - {b.compania_texto})</option>)}</Form.Select></Form.Group>
                    
                    {esVehicular && (<Card className="mb-3 border-primary"><Card.Header className="bg-primary text-white py-1"><FaCar className="me-2"/>Datos Vehículo</Card.Header><Card.Body><Row className="g-2 mb-2"><Col><Form.Control placeholder="Patente" name="vehiculo_patente" value={formulario.vehiculo_patente} onChange={handleInputChange} /></Col><Col><Form.Control placeholder="Tipo" name="vehiculo_tipo" value={formulario.vehiculo_tipo} onChange={handleInputChange} /></Col></Row><Row className="g-2"><Col><Form.Control placeholder="Marca" name="vehiculo_marca" value={formulario.vehiculo_marca} onChange={handleInputChange} /></Col><Col><Form.Control placeholder="Modelo" name="vehiculo_modelo" value={formulario.vehiculo_modelo} onChange={handleInputChange} /></Col></Row></Card.Body></Card>)}

                    <Card className="bg-light border-0 mb-3"><Card.Body><h6 className="text-primary fw-bold">Afectado</h6>
                        <Row className="g-2">
                            <Col md={3}><Form.Control placeholder="RUT" name="afectado_rut" value={formulario.afectado_rut} onChange={handleInputChange} maxLength={12}/></Col>
                            <Col md={6}><Form.Control placeholder="Nombre" name="afectado_nombre" value={formulario.afectado_nombre} onChange={handleInputChange} /></Col>
                            <Col md={3}>
                                <InputGroup>
                                    <InputGroup.Text>+56</InputGroup.Text>
                                    <Form.Control placeholder="912345678" name="afectado_telefono" value={formulario.afectado_telefono} onChange={handleInputChange} maxLength={9} />
                                </InputGroup>
                            </Col>
                        </Row>
                    </Card.Body></Card>

                    <Card className="bg-light border-0 mb-3"><Card.Body><h6 className="text-secondary fw-bold">Denunciante</h6><Row className="g-2"><Col md={4}><Form.Control placeholder="RUT" name="denunciante_rut" value={formulario.denunciante_rut} onChange={handleInputChange} maxLength={12}/></Col><Col md={8}><Form.Control placeholder="Nombre" name="denunciante_nombre" value={formulario.denunciante_nombre} onChange={handleInputChange} /></Col></Row></Card.Body></Card>
                    <Form.Group className="mt-3"><Form.Label className="fw-bold">Descripción</Form.Label><Form.Control as="textarea" rows={3} name="descripcion" value={formulario.descripcion} onChange={handleInputChange} /></Form.Group>
                </div>
            )}

            {/* Pagina 2: GENERAL */}
            {Pagina === 2 && (
                <div className="animacion-fade">
                    <h5 className="text-secondary border-bottom pb-2"><FaClipboardList className="me-2"/>Datos Generales</h5>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Label>Fecha (*)</Form.Label>
                            {/* FECHA HOY */}
                            <Form.Control type="date" name="fecha" max={fechaHoy} value={formulario.fecha} onChange={handleInputChange}/>
                        </Col>
                        <Col md={6}><Form.Label>Hora Alarma (*)</Form.Label><Form.Control type="time" name="hora" value={formulario.hora} onChange={handleInputChange}/></Col>
                    </Row>
                    <Form.Group className="mb-3"><Form.Label>Lugar (*)</Form.Label><div className="d-flex gap-2 mb-2"><Form.Control value={formulario.lugar} name="lugar" onChange={handleInputChange} placeholder="Dirección..."/><Button type="button" variant={mostrarMapa?"secondary":"info"} onClick={()=>setMostrarMapa(!mostrarMapa)} className="text-white">{mostrarMapa?"Cerrar":"Mapa"}</Button></div>{mostrarMapa && <SelectorMapa alSeleccionarUbicacion={recibirCoordenadas}/>}</Form.Group>
                    <Form.Group className="mb-3"><Form.Label>Subtipo</Form.Label><Form.Select name="subtipo" value={formulario.subtipo} onChange={handleInputChange} disabled={!subtiposDisponibles.length}><option value="">{subtiposDisponibles.length?"Seleccione...":"Sin detalle"}</option>{subtiposDisponibles.map(s=><option key={s.id} value={s.id}>{s.codigo_subtipo} - {s.descripcion}</option>)}</Form.Select></Form.Group>
                </div>
            )}

            {/* Pagina 3: LOGÍSTICA*/}
            {Pagina === 3 && (
                <div className="animacion-fade">
                    <h5 className="text-secondary border-bottom pb-2"><FaTruck className="me-2"/>Recursos y Tiempos</h5>
                    <SelectorCarros alCambiarCarros={setCarrosSeleccionados} />
                    <Form.Group className="mt-3 mb-3"><Form.Label className="fw-bold text-danger"><FaUserSecret className="me-2"/>Maquinista (*)</Form.Label><Form.Select name="maquinista" value={formulario.maquinista} onChange={handleInputChange}><option value="">Seleccione...</option>{listaBomberos.map(b=><option key={b.id} value={b.id}>{b.nombre_completo} ({b.rango_texto} - {b.compania_texto})</option>)}</Form.Select></Form.Group>
                    <div className="p-3 bg-light rounded"><h6 className="text-danger fw-bold">Cronología</h6><Row className="g-2 mb-2"><Col><Form.Label className="small">Salida (6-0)</Form.Label><Form.Control type="time" name="hora_salida_cuartel" value={formulario.hora_salida_cuartel} onChange={handleInputChange}/></Col><Col><Form.Label className="small">Llegada (6-3)</Form.Label><Form.Control type="time" name="hora_llegada_emergencia" value={formulario.hora_llegada_emergencia} onChange={handleInputChange}/></Col><Col><Form.Label className="small">Control</Form.Label><Form.Control type="time" name="hora_control_emergencia" value={formulario.hora_control_emergencia} onChange={handleInputChange}/></Col></Row><Row className="g-2"><Col><Form.Label className="small">Extinción</Form.Label><Form.Control type="time" name="hora_extincion" value={formulario.hora_extincion} onChange={handleInputChange}/></Col><Col><Form.Label className="small">Termino (6-10)</Form.Label><Form.Control type="time" name="hora_termino_emergencia" value={formulario.hora_termino_emergencia} onChange={handleInputChange}/></Col></Row><hr/><h6 className="text-secondary fw-bold"><FaTachometerAlt className="me-2"/>Kilometraje</h6><Row><Col><Form.Control type="number" min="0" placeholder="Salida" name="km_salida" value={formulario.km_salida} onChange={handleInputChange}/></Col><Col><Form.Control type="number" min="0" placeholder="Llegada" name="km_llegada" value={formulario.km_llegada} onChange={handleInputChange}/></Col></Row></div>
                </div>
            )}

            {/* Pagina 4 */}
            {Pagina === 4 && (
                <div className="animacion-fade">
                    <Row><Col md={6} className="border-end"><h5 className="text-secondary mb-3"><FaUsers className="me-2"/>Asistencia Cias</h5>{['PRIMERA', 'SEGUNDA', 'TERCERA'].map(cia => (<div key={cia} className="mb-4"><h6 className="text-danger fw-bold border-bottom">{cia} COMPAÑÍA</h6><div className="d-flex flex-wrap gap-2">{bomberosPorCia(cia).map(bombero => {const seleccionado = asistenciaBomberos.includes(bombero.id);return (<Button key={bombero.id} size="sm" variant={seleccionado ? "danger" : "outline-secondary"} onClick={() => toggleBombero(bombero.id)} style={{borderRadius: '20px'}} type="button">{bombero.nombre_completo || bombero.username}</Button>)})}{bomberosPorCia(cia).length === 0 && <span className="text-muted small">Sin voluntarios</span>}</div>
                    </div>))}</Col><Col md={6}><h5 className="text-secondary mb-3"><FaShieldAlt className="me-2"/>Otras Instituciones</h5>
                        {['samu', 'carabineros', 'seguridad', 'conaf'].map(ent => (
                            <Card key={ent} className={`mb-3 ${apoyoExterno[ent].activo ? 'border-success' : ''}`}><Card.Header className="d-flex justify-content-between align-items-center py-2"><span className="text-capitalize">{ent}</span><Form.Check type="switch" checked={apoyoExterno[ent].activo} onChange={() => handleExternoCheck(ent)} /></Card.Header>{apoyoExterno[ent].activo && <Card.Body className="p-2"><Row className="g-1"><Col><Form.Control size="sm" placeholder="A Cargo" onChange={(e)=>handleExternoChange(ent,'a_cargo',e.target.value)}/></Col><Col><Form.Control size="sm" placeholder="Unidad/Móvil" onChange={(e)=>handleExternoChange(ent,'patente',e.target.value)}/></Col><Col><Form.Control size="sm" type="number" placeholder="Cant." onChange={(e)=>handleExternoChange(ent,'cantidad',e.target.value)}/></Col></Row></Card.Body>}</Card>
                        ))}
                    </Col></Row>
                </div>
            )}

            {/* BOTONES */}
            <div className="d-flex justify-content-center mt-4 gap-3">{[1, 2, 3, 4].map(n => (<Button key={n} type="button" variant={Pagina === n ? "danger" : "outline-secondary"} className="rounded-circle fw-bold" style={{width: 40, height: 40}} onClick={() => irAlPagina(n)}>{n}</Button>))}</div>
            <div className="d-flex justify-content-between mt-4 border-top pt-3"><Button type="button" variant="outline-secondary" onClick={() => irAlPagina(Pagina - 1)} disabled={Pagina === 1}><FaChevronLeft/> Atrás</Button>{Pagina < 4 ? <Button type="button" variant="danger" onClick={() => irAlPagina(Pagina + 1)}>Siguiente <FaChevronRight/></Button> : <Button type="button" variant="success" onClick={handleSubmit}>Finalizar y Guardar ✅</Button>}</div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default FormularioParte;
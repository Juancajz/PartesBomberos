import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Button, Badge, Spinner } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { FaPhoneAlt, FaMapMarkerAlt, FaTruck, FaExclamationTriangle, FaCommentDots, FaBroadcastTower, FaPlusCircle, FaTimes, FaUserEdit } from 'react-icons/fa';

import SelectorMapa from './SelectorMapa';

function Despacho() {
    const [tiposEmergencia, setTiposEmergencia] = useState([]);
    const [carros, setCarros] = useState([]);
    const [listaBomberos, setListaBomberos] = useState([]);
    
    const [cargando, setCargando] = useState(true);
    const [mostrarMapa, setMostrarMapa] = useState(false);
    const [emergenciasActivas, setEmergenciasActivas] = useState([]);
    const [modoApoyo, setModoApoyo] = useState(null); 

    const [formulario, setFormulario] = useState({
        tipo_emergencia: '',
        lugar: '',
        latitud: null,
        longitud: null,
        descripcion: '', 
        carros_seleccionados: []
    });

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const resTipos = await axios.get('/api/tipos-emergencia/');
                const resCarros = await axios.get('/api/carros/');
                const resBomberos = await axios.get('/api/bomberos/');
                const resActivas = await axios.get('/api/emergencias-activas/');
                
                const dataTipos = Array.isArray(resTipos.data) ? resTipos.data : (resTipos.data.results || []);
                const dataCarros = Array.isArray(resCarros.data) ? resCarros.data : (resCarros.data.results || []);
                const dataBomberos = Array.isArray(resBomberos.data) ? resBomberos.data : (resBomberos.data.results || []);
                const dataActivas = Array.isArray(resActivas.data) ? resActivas.data : (resActivas.data.results || []);

                setTiposEmergencia(dataTipos);
                setListaBomberos(dataBomberos);
                setEmergenciasActivas(dataActivas);
                
                const carrosInicializados = dataCarros.map(c => {
                    const emergenciaDondeEsta = dataActivas.find(em => em.carros.includes(c.id));
                    if (emergenciaDondeEsta) {
                        return { ...c, estado: 'DESPACHADO', emergencia_actual_id: emergenciaDondeEsta.id };
                    }
                    return { ...c, estado: 'DISPONIBLE', emergencia_actual_id: null };
                });
                setCarros(carrosInicializados);

            } catch (error) {
                console.error("Error cargando datos:", error);
                if (error.response?.status === 401) {
                    Swal.fire('Sesión no encontrada', 'Al recargar la página se perdió la sesión.', 'warning');
                } else {
                    Swal.fire('Error', 'No se pudieron cargar los datos de la central.', 'error');
                }
            } finally {
                setCargando(false);
            }
        };
        cargarDatos();
    }, []);

    const handleChange = (e) => setFormulario({ ...formulario, [e.target.name]: e.target.value });

    const recibirCoordenadas = (direccion, latlng) => {
        setFormulario(prev => ({ ...prev, lugar: direccion || `Coordenadas: ${latlng.lat}, ${latlng.lng}`, latitud: latlng.lat, longitud: latlng.lng }));
    };

    const toggleCarro = (carroId) => {
        setFormulario(prev => {
            const seleccionados = prev.carros_seleccionados.includes(carroId)
                ? prev.carros_seleccionados.filter(id => id !== carroId)
                : [...prev.carros_seleccionados, carroId];
            return { ...prev, carros_seleccionados: seleccionados };
        });
    };

    const iniciarApoyo = (emergencia) => {
        setModoApoyo(emergencia);
        setFormulario({
            tipo_emergencia: emergencia.tipo_emergencia,
            lugar: emergencia.lugar,
            latitud: emergencia.latitud,
            longitud: emergencia.longitud,
            descripcion: emergencia.descripcion,
            carros_seleccionados: [] 
        });
        setMostrarMapa(false);
        window.scrollTo(0, 0); 
    };

    const cancelarApoyo = () => {
        setModoApoyo(null);
        setFormulario({ tipo_emergencia: '', lugar: '', latitud: null, longitud: null, descripcion: '', carros_seleccionados: [] });
    };

    const handleAsignarResponsable = async (parteId, bomberoId) => {
        try {
            await axios.post(`/api/partes/${parteId}/asignar-responsable/`, { bombero_id: bomberoId });
            
            setEmergenciasActivas(prev => prev.map(em => {
                if (em.id === parteId) {
                    const b = listaBomberos.find(bom => bom.id === parseInt(bomberoId));
                    let nombreMostrar = "Asignado";
                    if (b) {
                        nombreMostrar = (b.first_name || b.last_name) 
                            ? `${b.first_name || ''} ${b.last_name || ''}`.trim() 
                            : b.username;
                    }
                    
                    return { ...em, responsable_edicion_id: bomberoId, responsable_edicion_nombre: nombreMostrar };
                }
                return em;
            }));

            Swal.fire({
                toast: true, position: 'top-end', icon: 'success', 
                title: 'Responsable asignado', showConfirmButton: false, timer: 1500
            });
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo asignar al responsable.', 'error');
        }
    };

    const handleDespachar = async (e) => {
        e.preventDefault();

        if (!formulario.tipo_emergencia) return Swal.fire('Falta Dato', 'Seleccione el código.', 'warning');
        if (!formulario.lugar) return Swal.fire('Falta Dato', 'Ingrese la dirección.', 'warning');
        if (formulario.carros_seleccionados.length === 0) return Swal.fire('Atención', 'Seleccione al menos un carro.', 'warning');

        const titulo = modoApoyo ? '¿Despachar Apoyo?' : '¿Confirmar Nuevo Despacho?';
        const texto = modoApoyo ? `Se enviarán <b>${formulario.carros_seleccionados.length}</b> unidades en APOYO a <b>${formulario.lugar}</b>.` 
                                : `Se despacharán <b>${formulario.carros_seleccionados.length}</b> unidades a <b>${formulario.lugar}</b>.`;

        const confirmacion = await Swal.fire({
            title: titulo, html: texto, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Sí, ¡Despachar! 🚨'
        });

        if (confirmacion.isConfirmed) {
            Swal.fire({ title: 'Despachando...', didOpen: () => Swal.showLoading() });
            
            try {
                const payload = {
                    tipo_emergencia: formulario.tipo_emergencia,
                    lugar: formulario.lugar,
                    descripcion: formulario.descripcion,
                    latitud: formulario.latitud,
                    longitud: formulario.longitud,
                    carros_seleccionados: formulario.carros_seleccionados,
                    emergencia_padre_id: modoApoyo ? modoApoyo.id : null 
                };

                const response = await axios.post('/api/despachar/', payload);
                const dataDespacho = response.data;
                const targetEmergenciaId = modoApoyo ? modoApoyo.id : dataDespacho.emergencia_id;

                setCarros(prevCarros => prevCarros.map(c => 
                    formulario.carros_seleccionados.includes(c.id) 
                    ? { ...c, estado: 'DESPACHADO', emergencia_actual_id: targetEmergenciaId } 
                    : c
                ));

                if (modoApoyo) {
                    setEmergenciasActivas(prev => prev.map(em => 
                        em.id === modoApoyo.id 
                        ? { ...em, carros: [...new Set([...em.carros, ...formulario.carros_seleccionados])] } 
                        : em
                    ));
                    Swal.fire('¡Apoyo en Camino!', 'Unidades despachadas a la emergencia.', 'success');
                } else {
                    const nuevaEmergencia = {
                        id: targetEmergenciaId, 
                        tipo_emergencia: formulario.tipo_emergencia,
                        codigo_texto: tiposEmergencia.find(t => t.id === parseInt(formulario.tipo_emergencia))?.codigo || '10-X',
                        lugar: formulario.lugar,
                        latitud: formulario.latitud,
                        longitud: formulario.longitud,
                        descripcion: formulario.descripcion,
                        hora: dataDespacho.hora_despacho || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        carros: formulario.carros_seleccionados,
                        responsable_edicion_id: null 
                    };
                    setEmergenciasActivas([nuevaEmergencia, ...emergenciasActivas]);
                    Swal.fire('¡Despacho Exitoso!', 'Se ha generado el Parte en Curso.', 'success');
                }
                
                cancelarApoyo(); 
                setMostrarMapa(false);

            } catch (error) {
                console.error("Error al despachar:", error);
                const msj = error.response?.data?.error || 'Revisa la consola del servidor.';
                Swal.fire('Error en el Servidor', msj, 'error');
            }
        }
    };

    if (cargando) return <Container className="text-center mt-5"><Spinner animation="border" variant="danger" /></Container>;

    return (
        <Container fluid className="px-4 mt-4 mb-5">
            <h2 className="text-danger fw-bold mb-4 border-bottom pb-2">
                <FaBroadcastTower className="me-3 mb-1" />Central de Operaciones y Despacho
            </h2>

            <Row className="g-3">
                <Col lg={4}>
                    <Card className={`shadow border-2 ${modoApoyo ? 'border-primary' : 'border-danger'}`}>
                        <Card.Header className={`${modoApoyo ? 'bg-primary' : 'bg-danger'} text-white fw-bold fs-5 d-flex justify-content-between align-items-center`}>
                            {modoApoyo ? <span>Despachar Apoyo 🚑</span> : <span>Generar Nuevo Despacho</span>}
                            {modoApoyo && <Button variant="outline-light" size="sm" onClick={cancelarApoyo}><FaTimes /> Cancelar</Button>}
                        </Card.Header>
                        <Card.Body className="bg-light">
                            {modoApoyo && <div className="alert alert-primary p-2 small fw-bold">🚨 Bloqueado: Los carros se sumarán al parte existente.</div>}
                            <Form onSubmit={handleDespachar}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold text-secondary"><FaExclamationTriangle className="me-2"/>Código (*)</Form.Label>
                                    <Form.Select size="lg" name="tipo_emergencia" value={formulario.tipo_emergencia} onChange={handleChange} disabled={!!modoApoyo} className="fw-bold">
                                        <option value="">Seleccionar 10-X...</option>
                                        {tiposEmergencia.map(t => <option key={t.id} value={t.id}>{t.codigo} - {t.descripcion}</option>)}
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold text-secondary"><FaMapMarkerAlt className="me-2"/>Lugar Exacto (*)</Form.Label>
                                    <div className="d-flex gap-2 mb-2">
                                        <Form.Control type="text" placeholder="Ej: Av. Brasil..." name="lugar" value={formulario.lugar} onChange={handleChange} disabled={!!modoApoyo} />
                                        {!modoApoyo && <Button variant={mostrarMapa ? "secondary" : "info"} onClick={() => setMostrarMapa(!mostrarMapa)} className="text-white fw-bold">{mostrarMapa ? "Ocultar" : "Mapa"}</Button>}
                                    </div>
                                    {mostrarMapa && !modoApoyo && <div className="border rounded p-1 shadow-sm bg-white mb-2"><SelectorMapa alSeleccionarUbicacion={recibirCoordenadas} /></div>}
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold text-secondary"><FaCommentDots className="me-2"/>Pre-Informe / Detalle</Form.Label>
                                    <Form.Control as="textarea" rows={2} name="descripcion" value={formulario.descripcion} onChange={handleChange} disabled={!!modoApoyo} />
                                </Form.Group>

                                <div className="d-grid mt-4">
                                    <Button variant={modoApoyo ? "primary" : "danger"} size="lg" type="submit" className="fw-bold shadow-sm">
                                        {modoApoyo ? "ENVIAR APOYO 🚨" : "DESPACHAR UNIDADES 🚨"}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={5}>
                    <Card className="shadow border-0 h-100">
                        <Card.Header className="bg-dark text-white fw-bold fs-5">Estado del Material Mayor</Card.Header>
                        <Card.Body className="bg-secondary bg-opacity-10">
                            <h6 className="text-muted mb-3 text-center">Haz click en cualquier unidad para seleccionarla:</h6>
                            <Row className="g-2">
                                {carros.map(carro => {
                                    const estaSeleccionado = formulario.carros_seleccionados.includes(carro.id);
                                    let bgClass = "bg-white"; let borderClass = "border-success"; let textClass = "text-dark"; let badgeColor = "success"; let statusText = "DISPONIBLE";
                                    
                                    if (estaSeleccionado) {
                                        bgClass = "bg-warning"; borderClass = "border-warning"; textClass = "text-dark"; badgeColor = "dark"; statusText = "A DESPACHAR";
                                    } else if (carro.estado === 'DESPACHADO') {
                                        bgClass = "bg-info bg-opacity-25"; borderClass = "border-info"; textClass = "text-primary"; badgeColor = "primary"; statusText = "EN TERRENO";
                                    }

                                    return (
                                        <Col xs={6} md={4} key={carro.id}>
                                            <Card 
                                                className={`text-center shadow-sm h-100 ${bgClass} ${borderClass}`}
                                                style={{ cursor: 'pointer', transition: 'all 0.2s', borderWidth: '2px' }}
                                                onClick={() => toggleCarro(carro.id)}
                                            >
                                                <Card.Body className="p-2">
                                                    <FaTruck size={28} className={`mb-1 ${textClass}`} opacity={0.8} />
                                                    <h5 className={`fw-bold mb-1 ${textClass}`}>{carro.nombre}</h5>
                                                    <Badge bg={badgeColor} className="fw-normal" style={{fontSize: '0.7rem'}}>{statusText}</Badge>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={3}>
                    <Card className="shadow border-0 h-100">
                        <Card.Header className="bg-secondary text-white fw-bold fs-5">
                            <div className="spinner-grow spinner-grow-sm text-danger me-2" role="status"></div>Emergencias Activas
                        </Card.Header>
                        <Card.Body className="bg-light p-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {emergenciasActivas.length === 0 ? (
                                <div className="text-center text-muted mt-5 p-3">
                                    <FaBroadcastTower size={40} className="mb-3 opacity-50"/>
                                    <h6>Sin emergencias activas</h6>
                                    <p className="small">Las unidades despachadas aparecerán aquí.</p>
                                </div>
                            ) : (
                                emergenciasActivas.map(em => (
                                    <Card key={em.id} className="mb-3 border-danger shadow-sm">
                                        <Card.Header className="bg-danger text-white py-1 px-2 d-flex justify-content-between align-items-center">
                                            <span className="fw-bold">{em.codigo_texto}</span>
                                            <span className="badge bg-dark">{em.hora}</span>
                                        </Card.Header>
                                        <Card.Body className="p-2">
                                            <div className="small fw-bold mb-1 text-truncate" title={em.lugar}>
                                                <FaMapMarkerAlt className="text-danger me-1"/>{em.lugar}
                                            </div>
                                            <div className="small text-muted mb-2 fst-italic" style={{fontSize: '0.8rem'}}>{em.descripcion || "Sin pre-informe"}</div>
                                            
                                            <div className="d-flex flex-wrap gap-1 mb-2">
                                                {em.carros.map(cId => {
                                                    const carro = carros.find(c => c.id === cId);
                                                    if (!carro) return null;
                                                    const sigueAqui = carro.emergencia_actual_id === em.id;
                                                    return (
                                                        <Badge key={cId} bg={sigueAqui ? "danger" : "info"} style={!sigueAqui ? { opacity: 0.7, textDecoration: 'line-through' } : {}} title={!sigueAqui ? "Reasignado a otra emergencia" : "Trabajando en el lugar"}>
                                                            {carro.nombre}
                                                        </Badge>
                                                    );
                                                })}
                                            </div>

                                            <div className="mt-2 border-top pt-2">
                                                <Form.Label className="small fw-bold text-secondary mb-1">
                                                    <FaUserEdit className="me-1"/> Responsable de Parte:
                                                </Form.Label>
                                                <Form.Select 
                                                    size="sm" 
                                                    value={em.responsable_edicion_id || ''} 
                                                    onChange={(e) => handleAsignarResponsable(em.id, e.target.value)}
                                                    className="bg-light"
                                                    style={{fontSize: '0.8rem'}}
                                                >
                                                    <option value="">-- Asignar Voluntario --</option>
                                                    {listaBomberos.map(b => {
                                                        const nombreOpcion = (b.first_name || b.last_name) 
                                                            ? `${b.first_name || ''} ${b.last_name || ''}`.trim() 
                                                            : `(Sin Nombre) RUT: ${b.username}`;
                                                        return (
                                                            <option key={b.id} value={b.id}>{nombreOpcion}</option>
                                                        )
                                                    })}
                                                </Form.Select>
                                            </div>

                                            <div className="d-grid mt-2">
                                                <Button variant="outline-primary" size="sm" className="fw-bold" style={{fontSize: '0.75rem'}} onClick={() => iniciarApoyo(em)}>
                                                    <FaPlusCircle /> Dar Apoyo a esta emergencia
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Despacho;
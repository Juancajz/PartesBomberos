import { useState, useEffect } from 'react';
import axios from 'axios';
import { Row, Col, Card, ListGroup, Badge } from 'react-bootstrap';
import { FaFire, FaCalendarAlt, FaChartBar, FaNewspaper } from 'react-icons/fa';

function Inicio() {
    const [datos, setDatos] = useState(null);

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/dashboard/')
            .then(res => {
                // --- EL ESCUDO ---
                // Nos aseguramos de que "recientes" siempre sea un Array (Lista)
                const dataSegura = {
                    total_mes: res.data?.total_mes || 0,
                    guardia: res.data?.guardia || { compania: "Sin asignar", mes: "-" },
                    recientes: Array.isArray(res.data?.recientes) ? res.data.recientes : []
                };
                setDatos(dataSegura);
            })
            .catch(error => {
                console.error("Error cargando el Dashboard:", error);
                // Si la sesión aún no engancha, le pasamos una estructura vacía para que no explote
                setDatos({
                    total_mes: 0,
                    guardia: { compania: "Cargando...", mes: "..." },
                    recientes: []
                });
            });
    }, []);

    if (!datos) return <div className="text-center mt-5">Cargando Dashboard...</div>;

    return (
        <div className="animacion-fade">
            <h2 className="mb-4 fw-bold">Bienvenido al Sistema</h2>
            <Row className="g-4">
                {/* ESTADÍSTICA RÁPIDA */}
                <Col md={4}>
                    <Card className="text-white bg-danger shadow border-0 h-100">
                        <Card.Body className="d-flex align-items-center">
                            <FaChartBar size={40} className="me-3 opacity-50"/>
                            <div>
                                <h6 className="mb-0">Emergencias del Mes</h6>
                                <h2 className="fw-bold mb-0">{datos.total_mes}</h2>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* GUARDIA ACTUAL */}
                <Col md={8}>
                    <Card className="shadow border-0 h-100">
                        <Card.Body className="d-flex align-items-center bg-dark text-white rounded">
                            <FaCalendarAlt size={30} className="me-3 text-warning"/>
                            <div>
                                <h6 className="mb-0 text-warning fw-bold">Compañía de Guardia</h6>
                                <h4 className="mb-0">{datos.guardia.compania}</h4>
                                <small className="opacity-75">Periodo: {datos.guardia.mes}</small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* ÚLTIMAS EMERGENCIAS (NOTICIAS) */}
                <Col md={12}>
                    <Card className="shadow border-0">
                        <Card.Header className="bg-white py-3">
                            <h5 className="mb-0 fw-bold text-secondary">
                                <FaNewspaper className="me-2 text-danger"/>Últimas 5 Emergencias
                            </h5>
                        </Card.Header>
                        <ListGroup variant="flush">
                            {datos.recientes.length === 0 ? (
                                <div className="text-center text-muted p-4">No hay emergencias recientes para mostrar.</div>
                            ) : (
                                datos.recientes.map(parte => (
                                    <ListGroup.Item key={parte.id} className="py-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <Badge bg="danger" className="me-2">{parte.tipo_detalle?.codigo}</Badge>
                                                <span className="fw-bold">{parte.lugar}</span>
                                                <div className="text-muted small">{new Date(parte.fecha_hora_emergencia).toLocaleString()}</div>
                                            </div>
                                            <FaFire className="text-danger opacity-25" size={20}/>
                                        </div>
                                    </ListGroup.Item>
                                ))
                            )}
                        </ListGroup>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default Inicio;
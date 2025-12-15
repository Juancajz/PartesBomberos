import { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Modal, Table, Badge, Button, Form } from 'react-bootstrap';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList 
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { 
    FaChartBar, FaChartPie, FaFireExtinguisher, FaUsers, FaTrophy, 
    FaFileExcel, FaMapMarkerAlt 
} from 'react-icons/fa';
import * as XLSX from 'xlsx';

function Estadisticas() {
  const [allPartes, setAllPartes] = useState([]);
  const [dataTipos, setDataTipos] = useState([]);
  const [dataCias, setDataCias] = useState([]);
  const [totalPartes, setTotalPartes] = useState(0);
  const [totalAsistencias, setTotalAsistencias] = useState(0);
  const [mesesDisponibles, setMesesDisponibles] = useState([]);
  const [filtroMes, setFiltroMes] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [ciaSeleccionada, setCiaSeleccionada] = useState("");
  const [rankingVoluntarios, setRankingVoluntarios] = useState([]);

  const COLORES_PIE = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    const cargar = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/partes/');
            const datos = res.data;
            setAllPartes(datos);
            const mesesUnicos = [...new Set(datos.map(p => p.fecha_hora_emergencia.slice(0, 7)))];
            setMesesDisponibles(mesesUnicos.sort().reverse());
        } catch (error) { console.error(error); }
    };
    cargar();
  }, []);

  useEffect(() => {
      let partesFiltrados = allPartes;
      if (filtroMes !== 'todos') {
          partesFiltrados = allPartes.filter(p => p.fecha_hora_emergencia.startsWith(filtroMes));
      }

      setTotalPartes(partesFiltrados.length);

      const conteoTipos = {};
      partesFiltrados.forEach(p => {
        const codigo = p.tipo_detalle?.codigo || 'S/I';
        conteoTipos[codigo] = (conteoTipos[codigo] || 0) + 1;
      });
      const arrayTipos = Object.keys(conteoTipos).map(key => ({
        name: key,
        cantidad: conteoTipos[key]
      }));
      setDataTipos(arrayTipos);

      const conteoCias = { 'PRIMERA': 0, 'SEGUNDA': 0, 'TERCERA': 0 };
      let sumaAsistencias = 0;

      partesFiltrados.forEach(p => {
        p.asistencias_bomberos.forEach(asist => {
            const cia = asist.compania || 'OTRA'; 
            if (conteoCias[cia] !== undefined) conteoCias[cia]++;
            else conteoCias['OTRA'] = (conteoCias['OTRA'] || 0) + 1;
            sumaAsistencias++;
        });
      });
      setTotalAsistencias(sumaAsistencias);

      const arrayCias = Object.keys(conteoCias)
        .filter(key => conteoCias[key] > 0)
        .map(key => ({ name: key, value: conteoCias[key] }));
      
      setDataCias(arrayCias);

  }, [allPartes, filtroMes]);

  const formatearMes = (yyyyMm) => {
      const [year, month] = yyyyMm.split('-');
      const nombreMes = new Date(year, month - 1).toLocaleString('es-CL', { month: 'long' });
      return `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${year}`;
  };

  const handleClickTorta = (data) => {
      const ciaName = data.name; 
      setCiaSeleccionada(ciaName);

      let partesActivos = allPartes;
      if (filtroMes !== 'todos') {
          partesActivos = allPartes.filter(p => p.fecha_hora_emergencia.startsWith(filtroMes));
      }

      const conteoVoluntarios = {};
      partesActivos.forEach(parte => {
          parte.asistencias_bomberos.forEach(asist => {
              if (asist.compania === ciaName) {
                  const nombre = asist.bombero_detalle?.nombre_completo || "Desconocido";
                  conteoVoluntarios[nombre] = (conteoVoluntarios[nombre] || 0) + 1;
              }
          });
      });

      const ranking = Object.keys(conteoVoluntarios)
          .map(nombre => ({ nombre, asistencia: conteoVoluntarios[nombre] }))
          .sort((a, b) => b.asistencia - a.asistencia);

      setRankingVoluntarios(ranking);
      setShowModal(true);
  };

  const descargarExcel = (datos, nombreArchivo) => {
      const hoja = XLSX.utils.json_to_sheet(datos);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Datos");
      XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);
  };

  const exportarGeneral = () => {
      let partesAExportar = allPartes;
      if (filtroMes !== 'todos') {
          partesAExportar = allPartes.filter(p => p.fecha_hora_emergencia.startsWith(filtroMes));
      }

      const datosLimpios = partesAExportar.map(p => ({
          ID: p.id,
          Fecha: p.fecha_hora_emergencia,
          Clave: p.tipo_detalle?.codigo,
          Descripcion: p.tipo_detalle?.descripcion,
          Lugar: p.lugar,
          Oficial: p.jefe_nombre,
          Latitud: p.latitud,
          Longitud: p.longitud,
          Estado: p.estado
      }));
      descargarExcel(datosLimpios, `Reporte_Bomberos_${filtroMes}`);
  };

  return (
    <Container className="mt-5 mb-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
        <h2 className="text-secondary fw-bold mb-0">📊 Panel de Estadísticas</h2>
        <div className="d-flex gap-2">
            <Form.Select 
                value={filtroMes} 
                onChange={(e) => setFiltroMes(e.target.value)}
                style={{width: '200px', fontWeight: 'bold'}}
                className="border-primary text-primary"
            >
                <option value="todos">📅 Total Histórico</option>
                {mesesDisponibles.map(mes => (
                    <option key={mes} value={mes}>{formatearMes(mes)}</option>
                ))}
            </Form.Select>
            <Button variant="success" onClick={exportarGeneral}>
                <FaFileExcel className="me-2"/>Excel
            </Button>
        </div>
      </div>

      <Row className="mb-4">
        <Col md={6} lg={3}>
            <Card className="shadow-sm border-0 bg-danger text-white mb-3">
                <Card.Body className="text-center">
                    <FaFireExtinguisher size={30} className="mb-2 opacity-75"/>
                    <h3>{totalPartes}</h3>
                    <div>Emergencias ({filtroMes === 'todos' ? 'Total' : 'Mes'})</div>
                </Card.Body>
            </Card>
        </Col>
        <Col md={6} lg={3}>
            <Card className="shadow-sm border-0 bg-primary text-white mb-3">
                <Card.Body className="text-center">
                    <FaUsers size={30} className="mb-2 opacity-75"/>
                    <h3>{totalAsistencias}</h3>
                    <div>Asistencias ({filtroMes === 'todos' ? 'Total' : 'Mes'})</div>
                </Card.Body>
            </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12} lg={6} className="mb-4">
            <Card className="shadow border-0 h-100">
                <Card.Header className="bg-white fw-bold"><FaChartBar className="me-2"/>Emergencias por Tipo</Card.Header>
                <Card.Body style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataTipos} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="cantidad" fill="#dc3545" name="N° Emergencias">
                                <LabelList dataKey="cantidad" position="top" fill="black" fontWeight="bold" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Card.Body>
            </Card>
        </Col>

        <Col md={12} lg={6} className="mb-4">
            <Card className="shadow border-0 h-100">
                <Card.Header className="bg-white fw-bold d-flex justify-content-between">
                    <span><FaChartPie className="me-2"/>Participación por Compañía</span>
                    <Badge bg="info" className="text-dark">¡Haz Clic para detalle!</Badge>
                </Card.Header>
                <Card.Body style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={dataCias}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                onClick={handleClickTorta}
                                style={{ cursor: 'pointer' }}
                            >
                                {dataCias.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORES_PIE[index % COLORES_PIE.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </Card.Body>
            </Card>
        </Col>
      </Row>

      {/* --- SECCIÓN MAPA DE CALOR --- */}
      <Row className="mt-4">
        <Col>
            <Card className="shadow border-0">
                <Card.Header className="bg-white fw-bold">
                    <FaMapMarkerAlt className="me-2"/>Mapa de Incidentes (Zonas Calientes)
                </Card.Header>
                <Card.Body style={{ height: "400px", padding: 0 }}>
                    <MapContainer center={[-37.2703, -72.7038]} zoom={13} style={{ height: "100%", width: "100%" }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {allPartes.map((p, idx) => (
                            p.latitud && p.longitud && (
                                <CircleMarker 
                                    key={idx}
                                    center={[p.latitud, p.longitud]}
                                    radius={10} 
                                    pathOptions={{ color: 'red', fillColor: '#f03', fillOpacity: 0.3, stroke: false }}
                                >
                                    <Popup>
                                        <b>{p.tipo_detalle?.codigo}</b><br/>
                                        {p.lugar}<br/>
                                        {new Date(p.fecha_hora_emergencia).toLocaleDateString()}
                                    </Popup>
                                </CircleMarker>
                            )
                        ))}
                    </MapContainer>
                </Card.Body>
            </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title><FaTrophy className="me-2 text-warning"/>Ranking: {ciaSeleccionada} ({filtroMes === 'todos' ? 'Histórico' : formatearMes(filtroMes)})</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Table striped hover responsive>
                <thead><tr><th>#</th><th>Voluntario</th><th className="text-center">Asistencias</th></tr></thead>
                <tbody>
                    {rankingVoluntarios.map((vol, index) => (
                        <tr key={index}>
                            <td className="fw-bold">{index + 1}</td>
                            <td>{vol.nombre}</td>
                            <td className="text-center"><Badge bg={index === 0 ? "warning" : "secondary"} text={index === 0 ? "dark" : "white"} pill>{vol.asistencia}</Badge></td>
                        </tr>
                    ))}
                    {rankingVoluntarios.length === 0 && <tr><td colSpan="3" className="text-center">No hay registros en este periodo.</td></tr>}
                </tbody>
            </Table>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
            <Button variant="success" onClick={() => descargarExcel(rankingVoluntarios, `Ranking_${ciaSeleccionada}_${filtroMes}`)}><FaFileExcel className="me-2"/>Descargar Ranking</Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Estadisticas;
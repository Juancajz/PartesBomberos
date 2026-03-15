import { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Container, Card } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

import Paso1Involucrados from './partes/Paso1Involucrados';
import Paso2Datos from './partes/Paso2Datos';
import Paso3Recursos from './partes/Paso3Recursos';
import Paso4Asistencia from './partes/Paso4Asistencia';

function FormularioParte({ tipoPreseleccionado }) {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const parteEdicionId = location.state?.parteEdicionId || null;
  const [modoEdicion, setModoEdicion] = useState(false);

  const [Pagina, setPagina] = useState(1);
  const [subtiposDisponibles, setSubtiposDisponibles] = useState([]);
  const [listaBomberos, setListaBomberos] = useState([]); 
  const [carrosSeleccionados, setCarrosSeleccionados] = useState([]); 
  const [datosPorCarro, setDatosPorCarro] = useState({}); 

  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [esVehicular, setEsVehicular] = useState(false);

  const fechaHoy = new Date().toISOString().split('T')[0];

  const [asistenciaBomberos, setAsistenciaBomberos] = useState([]);
  const [apoyoExterno, setApoyoExterno] = useState({
    samu: { activo: false, a_cargo: '', patente: '', cantidad: '' },
    carabineros: { activo: false, a_cargo: '', patente: '', cantidad: '' },
    seguridad: { activo: false, a_cargo: '', patente: '', cantidad: '' },
    conaf: { activo: false, a_cargo: '', patente: '', cantidad: '' },
  });

  const [formulario, setFormulario] = useState({
    fecha: fechaHoy,
    hora: new Date().toTimeString().slice(0, 5),
    lugar: '',
    latitud: null,
    longitud: null,
    tipo: tipoPreseleccionado ? tipoPreseleccionado.id : '',
    subtipo: '',
    jefe_a_cargo: '',
    quien_anoto: '',
    afectado_rut: '',
    afectado_nombre: '',
    afectado_telefono: '',
    denunciante_rut: '',
    denunciante_nombre: '',
    descripcion: '',
    vehiculo_patente: '',
    vehiculo_marca: '',
    vehiculo_modelo: '',
    vehiculo_color: '',
    vehiculo_tipo: '',
    hora_salida_cuartel: '',
    hora_llegada_emergencia: '',
    hora_control_emergencia: '',
    hora_extincion: '', 
    hora_termino_emergencia: '',
  });

  useEffect(() => {
    if (!tipoPreseleccionado && !parteEdicionId) {
        navigate('/ingreso');
        return;
    }

    axios.get('/api/bomberos/').then(res => {
        setListaBomberos(Array.isArray(res.data) ? res.data : (res.data.results || []));
    });

    if (parteEdicionId) {
        setModoEdicion(true);
        axios.get(`/api/partes/${parteEdicionId}/`).then(res => {
            const data = res.data;
            
            const fechaObj = new Date(data.fecha_hora_emergencia);
            const fFecha = fechaObj.toISOString().split('T')[0];
            const fHora = fechaObj.toTimeString().slice(0, 5);

            const tipoReal = typeof data.tipo_emergencia === 'object' ? data.tipo_emergencia?.id : data.tipo_emergencia;

            setFormulario(prev => ({
                ...prev,
                fecha: fFecha,
                hora: fHora,
                lugar: data.lugar || '',
                latitud: data.latitud || null,
                longitud: data.longitud || null,
                tipo: tipoReal || '', 
                descripcion: data.descripcion || '',
                jefe_a_cargo: data.jefe_a_cargo || '',
                quien_anoto: data.quien_anoto || ''
            }));

            if (data.asistencias_carros && data.asistencias_carros.length > 0) {
                const idsCarros = data.asistencias_carros.map(c => c.carro);
                setCarrosSeleccionados(idsCarros);
                
                const objCarros = {};
                data.asistencias_carros.forEach(c => {
                    objCarros[c.carro] = {
                        km_salida: c.km_salida || 0,
                        km_llegada: c.km_llegada || 0,
                        conductor: c.conductor || ''
                    };
                });
                setDatosPorCarro(objCarros);

                const primerCarro = data.asistencias_carros[0];
                if (primerCarro.hora_salida_cuartel) {
                    setFormulario(prev => ({ ...prev, hora_salida_cuartel: primerCarro.hora_salida_cuartel.slice(0,5) }));
                }
            }

            axios.get('/api/subtipos-emergencia/').then(resSub => {
                const dataSub = Array.isArray(resSub.data) ? resSub.data : (resSub.data.results || []);
                setSubtiposDisponibles(dataSub.filter(s => s.tipo_padre === tipoReal));
            });

        }).catch(err => {
            console.error(err);
            Swal.fire('Error', 'No se pudo cargar el parte para editar.', 'error');
        });
    } else if (tipoPreseleccionado) {
        const cod = tipoPreseleccionado.codigo;
        setEsVehicular(cod.startsWith('10-1') || cod.startsWith('10-4'));
        axios.get('/api/subtipos-emergencia/').then(res => {
            const dataSub = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setSubtiposDisponibles(dataSub.filter(s => s.tipo_padre === tipoPreseleccionado.id));
        });
    }
  }, [tipoPreseleccionado, parteEdicionId, navigate]);

  useEffect(() => {
    carrosSeleccionados.forEach(carroId => {
        if (!datosPorCarro[carroId]) {
            axios.get(`/api/carros/${carroId}/ultimo_km/`)
                .then(res => setDatosPorCarro(prev => ({ ...prev, [carroId]: { km_salida: res.data.ultimo_km || 0, km_llegada: 0, conductor: '' } })))
                .catch(err => console.error(err));
        }
    });
  }, [carrosSeleccionados]);

  const handleCarroChange = (carroId, campo, valor) => {
    setDatosPorCarro(prev => ({ ...prev, [carroId]: { ...prev[carroId], [campo]: valor } }));
  };

  const handleInputChange = (e) => {
      const { name, value } = e.target;
      if ((name.includes('nombre')) && value !== '' && !/^[a-zA-Z\u00C0-\u00FF\s]*$/.test(value)) return;
      if (name === 'afectado_telefono' && (value.length > 9 || (value !== '' && !/^\d*$/.test(value)))) return;
      
      if (name.includes('rut')) {
          setFormulario({ ...formulario, [name]: formatearRUT(value) });
      } else {
          setFormulario({ ...formulario, [name]: value });
      }
  };

  const formatearRUT = (rut) => {
    let valor = rut.replace(/[^0-9kK]/g, ''); 
    if (valor.length > 1) {
        const cuerpo = valor.slice(0, -1);
        const dv = valor.slice(-1);
        return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
    }
    return valor;
  };

  const recibirCoordenadas = (direccion, latlng) => {
    setFormulario(prev => ({ ...prev, lugar: direccion || `Coordenadas: ${latlng.lat}, ${latlng.lng}`, latitud: latlng.lat, longitud: latlng.lng }));
  };

  const toggleBombero = (id) => {
    setAsistenciaBomberos(prev => prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]);
  };
  
  const handleExternoCheck = (ent) => setApoyoExterno({ ...apoyoExterno, [ent]: { ...apoyoExterno[ent], activo: !apoyoExterno[ent].activo } });
  const handleExternoChange = (ent, field, val) => setApoyoExterno({ ...apoyoExterno, [ent]: { ...apoyoExterno[ent], [field]: val } });

  const irAlPagina = (nuevoPagina) => {
    if (Pagina === 1 && nuevoPagina > 1) {
        if (!formulario.jefe_a_cargo || !formulario.quien_anoto) return Swal.fire('Faltan Datos', 'Oficial a Cargo y Anotador son obligatorios', 'warning');
    }
    if (Pagina === 2 && nuevoPagina > 2) {
        if (!formulario.lugar || !formulario.fecha) return Swal.fire('Faltan Datos', 'Fecha y Lugar son obligatorios', 'warning');
    }
    if (Pagina === 3 && nuevoPagina > 3) {
        if (carrosSeleccionados.length === 0) return Swal.fire('Faltan Datos', 'Selecciona al menos un carro', 'warning');
        if (!formulario.hora_salida_cuartel || !formulario.hora_llegada_emergencia || !formulario.hora_control_emergencia || !formulario.hora_extincion || !formulario.hora_termino_emergencia) {
            return Swal.fire('Faltan Datos', 'Toda la cronología es obligatoria', 'warning');
        }
        for (let id of carrosSeleccionados) {
            const d = datosPorCarro[id];
            if (!d?.conductor || !d?.km_salida || !d?.km_llegada) return Swal.fire('Faltan Datos', 'Completa maquinista y KM de todos los carros', 'warning');
            if (parseInt(d.km_llegada) <= parseInt(d.km_salida)) return Swal.fire('Error KM', 'El KM de llegada debe ser mayor al de salida', 'warning');
        }
    }
    setPagina(nuevoPagina);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    if(e) e.preventDefault();
    const limpiar = (v) => (v === "" || v === "0") ? null : v;

    const detalleCarrosArray = carrosSeleccionados.map(id => ({
        carro_id: id,
        km_salida: parseInt(datosPorCarro[id]?.km_salida) || 0,
        km_llegada: parseInt(datosPorCarro[id]?.km_llegada) || 0,
        conductor_id: datosPorCarro[id]?.conductor || null,
    }));

    const payload = {
        ...formulario,
        tipo_emergencia: formulario.tipo,
        descripcion: formulario.descripcion || "Sin descripción adicional.",
        fecha_hora_emergencia: `${formulario.fecha}T${formulario.hora}:00`,
        afectado_telefono: formulario.afectado_telefono ? '+56' + formulario.afectado_telefono : null,
        subtipo_emergencia: limpiar(formulario.subtipo),
        detalle_carros: detalleCarrosArray,
        bomberos_ids: asistenciaBomberos,
        apoyo_externo: apoyoExterno,
        hora_llegada_cuartel: formulario.hora_termino_emergencia
    };

    try {
        Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });
        
        if (modoEdicion) {
            await axios.patch(`/api/partes/${parteEdicionId}/`, payload);
            Swal.fire('¡Actualizado!', 'El Parte ha sido completado y actualizado.', 'success').then(() => navigate('/historial'));
        } else {
            await axios.post('/api/partes/', payload);
            Swal.fire('¡Éxito!', 'Parte guardado correctamente', 'success').then(() => navigate('/historial'));
        }
        
    } catch (error) {
        console.error(error);
        const detalle = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        Swal.fire('Error en el Servidor', `Detalle: ${detalle}`, 'error');
    }
  };

  if (!tipoPreseleccionado && !parteEdicionId) return null;

  return (
    <Container className="mt-4 mb-5">
      <Card className="shadow border-0">
        <div className="bg-danger text-white p-3 d-flex justify-content-between align-items-center rounded-top">
            <h5 className="mb-0 fw-bold">🔥 {modoEdicion ? `Completando Parte #${parteEdicionId}` : tipoPreseleccionado?.codigo}</h5>
            <span className="badge bg-white text-danger">Paso {Pagina} de 4</span>
        </div>
        <Card.Body className="p-4">
          <Form>
            {Pagina === 1 && <Paso1Involucrados formulario={formulario} handleInputChange={handleInputChange} listaBomberos={listaBomberos} esVehicular={esVehicular} />}
            {Pagina === 2 && <Paso2Datos formulario={formulario} handleInputChange={handleInputChange} subtiposDisponibles={subtiposDisponibles} mostrarMapa={mostrarMapa} setMostrarMapa={setMostrarMapa} recibirCoordenadas={recibirCoordenadas} fechaHoy={fechaHoy} />}
            {Pagina === 3 && <Paso3Recursos formulario={formulario} handleInputChange={handleInputChange} setCarrosSeleccionados={setCarrosSeleccionados} listaBomberos={listaBomberos} carrosSeleccionados={carrosSeleccionados} datosPorCarro={datosPorCarro} handleCarroChange={handleCarroChange} />}
            {Pagina === 4 && <Paso4Asistencia listaBomberos={listaBomberos} asistenciaBomberos={asistenciaBomberos} toggleBombero={toggleBombero} apoyoExterno={apoyoExterno} handleExternoCheck={handleExternoCheck} handleExternoChange={handleExternoChange} />}

            <div className="d-flex justify-content-between mt-4 border-top pt-3">
                <Button variant="outline-secondary" onClick={() => irAlPagina(Pagina - 1)} disabled={Pagina === 1}><FaChevronLeft/> Atrás</Button>
                {Pagina < 4 ? 
                    <Button variant="danger" onClick={() => irAlPagina(Pagina + 1)}>Siguiente <FaChevronRight/></Button> 
                    : 
                    <Button variant="success" onClick={handleSubmit}>Finalizar y Guardar ✅</Button>
                }
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default FormularioParte;
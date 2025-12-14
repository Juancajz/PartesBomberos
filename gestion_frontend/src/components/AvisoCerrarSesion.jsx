import { useState, useEffect, useRef } from 'react';
import { Modal, Button, ProgressBar } from 'react-bootstrap';
import { FaExclamationTriangle, FaWalking, FaUserClock } from 'react-icons/fa';

const TIEMPO_INACTIVIDAD = 30 * 60 * 1000; // 30 Minutos en milisegundos
const TIEMPO_ADVERTENCIA = 15 * 1000;      // 15 Segundos de aviso
const TIEMPO_PARA_MOSTRAR_ALERTA = TIEMPO_INACTIVIDAD - TIEMPO_ADVERTENCIA;

function AvisoCerrarSesion({ onLogout }) {
  const [showModal, setShowModal] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(15);
  
  // Referencias para los temporizadores (para poder cancelarlos)
  const timerInactividad = useRef(null);
  const intervaloCuentaRegresiva = useRef(null);

  // 1. Función que reinicia el reloj si el usuario se mueve
  const reiniciarTemporizador = () => {
    if (showModal) return; // Si ya salió el aviso, no reiniciar automáticamente, esperar clic

    if (timerInactividad.current) clearTimeout(timerInactividad.current);
    if (intervaloCuentaRegresiva.current) clearInterval(intervaloCuentaRegresiva.current);

    // Programar la próxima alerta
    timerInactividad.current = setTimeout(() => {
        iniciarCuentaRegresiva();
    }, TIEMPO_PARA_MOSTRAR_ALERTA);
  };

  // 2. Función que arranca cuando se acaba el tiempo
  const iniciarCuentaRegresiva = () => {
    setShowModal(true);
    setSegundosRestantes(15);

    intervaloCuentaRegresiva.current = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          // SE ACABÓ EL TIEMPO: CERRAR SESIÓN
          clearInterval(intervaloCuentaRegresiva.current);
          cerrarSesion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cerrarSesion = () => {
    setShowModal(false);
    onLogout(); // Llamamos a la función de App.jsx
  };

  const mantenerSesion = () => {
    setShowModal(false);
    reiniciarTemporizador(); // Volvemos a empezar la cuenta de 30 min
  };

  // 3. Escuchar eventos del usuario (Mouse, Teclado, Clics)
  useEffect(() => {
    // Eventos que consideramos "actividad"
    const eventos = ['mousemove', 'keydown', 'click', 'scroll'];
    
    // Agregar escuchadores
    eventos.forEach(evento => window.addEventListener(evento, reiniciarTemporizador));
    
    // Iniciar el reloj apenas carga
    reiniciarTemporizador();

    // Limpieza al desmontar
    return () => {
      eventos.forEach(evento => window.removeEventListener(evento, reiniciarTemporizador));
      if (timerInactividad.current) clearTimeout(timerInactividad.current);
      if (intervaloCuentaRegresiva.current) clearInterval(intervaloCuentaRegresiva.current);
    };
  }, [showModal]); // Dependencia showModal para no reiniciar si el modal está abierto

  // Cálculo para la barra de progreso (porcentaje)
  const porcentaje = (segundosRestantes / 15) * 100;

  return (
    <Modal show={showModal} onHide={() => {}} backdrop="static" keyboard={false} centered>
      <Modal.Header className="bg-warning text-dark border-0">
        <Modal.Title className="fw-bold"><FaExclamationTriangle className="me-2"/>Cierre de Sesión</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center p-4">
        <FaUserClock size={50} className="text-warning mb-3" />
        <h5 className="mb-3">¿Sigues ahí?</h5>
        <p className="text-muted">
            Hemos detectado inactividad. Tu sesión se cerrará automáticamente por seguridad en:
        </p>
        
        <h1 className="display-4 fw-bold text-danger mb-3">{segundosRestantes}s</h1>
        
        <ProgressBar now={porcentaje} variant="danger" style={{height: '10px'}} />
      </Modal.Body>
      <Modal.Footer className="justify-content-center border-0 pb-4">
        <Button variant="secondary" onClick={cerrarSesion}>
            Cerrar ahora <FaWalking className="ms-1"/>
        </Button>
        <Button variant="success" onClick={mantenerSesion} className="px-4 fw-bold">
            ¡No cerrar! Sigo aquí
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AvisoCerrarSesion;
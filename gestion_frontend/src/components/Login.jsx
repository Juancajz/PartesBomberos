import { useState } from 'react';
import axios from 'axios';
import { Container, Card, Form, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { FaFireExtinguisher, FaUserShield } from 'react-icons/fa';

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      const resToken = await axios.post('http://127.0.0.1:8000/api/token/', {
        username: username,
        password: password
      });
      const token = resToken.data.access;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const resMe = await axios.get('http://127.0.0.1:8000/api/bomberos/me/', config);
      const esAdmin = resMe.data.is_staff;
      const nombreCompleto = resMe.data.nombre_completo || resMe.data.username; 
      localStorage.setItem('token_bomberos', token);
      onLogin(token, esAdmin, nombreCompleto);
      Swal.fire({
        icon: 'success',
        title: `Bienvenido/a`,
        text: nombreCompleto,
        timer: 1500,
        showConfirmButton: false
      });

    } catch (error) {
      console.error(error);
      // Feedback visual del error
      if (error.response && error.response.status === 401) {
          Swal.fire({ icon: 'error', title: 'Error', text: 'Credenciales incorrectas' });
      } else {
          Swal.fire({ icon: 'error', title: 'Error', text: 'Ocurrió un error al intentar ingresar' });
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Card className="shadow-lg border-0" style={{ width: '400px' }}>
        <Card.Body className="p-5">
          <div className="text-center mb-4">
            <div className="bg-danger text-white rounded-circle d-inline-flex justify-content-center align-items-center mb-3" style={{ width: 80, height: 80 }}>
                <FaFireExtinguisher size={40} />
            </div>
            <h3 className="fw-bold text-secondary">Gestión Bomberos</h3>
            <p className="text-muted small">Inicie sesión para acceder al sistema</p>
          </div>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Usuario</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Ingrese usuario" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                autoFocus 
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="********" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </Form.Group>

            <div className="d-grid">
              <Button variant="danger" type="submit" size="lg" disabled={cargando}>
                {cargando ? 'Verificando...' : 'Ingresar'} <FaUserShield className="ms-2"/>
              </Button>
            </div>
          </Form>
        </Card.Body>
        <Card.Footer className="text-center bg-white border-0 pb-4 text-muted small">Sistema de Gestión de Partes v1.0</Card.Footer>
      </Card>
    </Container>
  );
}

export default Login;
// apps/frontend/src/App.tsx
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Home from './pages/Home';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificamos al arrancar si el usuario ya tenía su sesión guardada
  useEffect(() => {
    const token = localStorage.getItem('river_app_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Limpiamos el token del navegador al salir
    localStorage.removeItem('river_app_token');
    setIsAuthenticated(false);
  };

  return (
    <>
      {isAuthenticated ? (
        <Home onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}

export default App;
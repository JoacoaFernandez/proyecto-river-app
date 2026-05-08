// apps/frontend/src/services/auth.service.ts
import axios from 'axios';

// La URL de tu backend NestJS corriendo de forma local
const API_URL = 'http://localhost:3000/auth';

export const login = async (email: string, password: string) => {
  try {
    // Enviamos los datos al endpoint de NestJS
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password,
    });

    // Si el backend responde con éxito, nos devolverá un token JWT
    if (response.data.access_token) {
      // Guardamos el token en el almacenamiento local del navegador (LocalStorage)
      localStorage.setItem('river_app_token', response.data.access_token);
    }

    return response.data;
  } catch (error: any) {
    // Si las credenciales son incorrectas, capturamos el error
    const message = error.response?.data?.message || 'Error al iniciar sesión';
    throw new Error(message);
  }
};
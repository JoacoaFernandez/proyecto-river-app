// apps/frontend/src/services/auth.service.ts
import { api } from './api';

export const register = async (email: string, password: string, display_name: string) => {
  try {
    const response = await api.post('/auth/register', { email, password, display_name });
    return response.data;
  } catch (error: any) {
    const msg = error.response?.data?.message;
    throw new Error(Array.isArray(msg) ? msg[0] : msg || 'Error al registrarse');
  }
};

export const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', { email, password });

    if (response.data.access_token) {
      localStorage.setItem('river_app_token', response.data.access_token);
    }

    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al iniciar sesión';
    throw new Error(message);
  }
};

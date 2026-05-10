// apps/frontend/src/services/auth.service.ts
import { api } from './api';

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

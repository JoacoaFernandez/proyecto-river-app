// apps/frontend/src/services/matches.service.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000/matches';

export const getLatestMatch = async () => {
  try {
    const token = localStorage.getItem('river_app_token');
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (response.data && response.data.length > 0) {
      // Intentamos buscar un partido que esté "live" (en vivo) o "finished" (terminado)
      const activeMatch = response.data.find((m: any) => m.status === 'live' || m.status === 'finished');
      // Si no hay ninguno jugado, devolvemos el primero programado que encontremos
      return activeMatch || response.data[0];
    }
    return null;
  } catch (error) {
    console.error('Error al obtener el partido:', error);
    return null;
  }
};
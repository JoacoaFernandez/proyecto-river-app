// apps/frontend/src/services/matches.service.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000/matches';

export const getLatestMatch = async () => {
  try {
    const token = localStorage.getItem('river_app_token');
    // Le mandamos el token JWT en las cabeceras para que NestJS nos deje pasar
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Si hay partidos, devolvemos el último de la lista (el más reciente)
    if (response.data && response.data.length > 0) {
      return response.data[response.data.length - 1];
    }
    return null;
  } catch (error) {
    console.error('Error al obtener el partido:', error);
    return null;
  }
};
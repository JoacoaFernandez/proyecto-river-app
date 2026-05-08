// apps/frontend/src/services/players.service.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000/players';

export const getPlayers = async () => {
  try {
    const token = localStorage.getItem('river_app_token');
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data; // Retorna la lista de jugadores reales desde Render
  } catch (error) {
    console.error('Error al obtener el plantel:', error);
    return [];
  }
};
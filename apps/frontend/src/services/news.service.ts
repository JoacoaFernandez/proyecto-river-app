// apps/frontend/src/services/news.service.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000/news';

export const getNews = async () => {
  try {
    const token = localStorage.getItem('river_app_token');
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data; // Devuelve la lista de noticias reales
  } catch (error) {
    console.error('Error al obtener las noticias de IA:', error);
    return [];
  }
};
// apps/frontend/src/services/players.service.ts
import { api } from './api';

export interface Player {
  id: string;
  name: string;
  position: string;
  number: number | null;
  age: number | null;
  photo: string | null;
  nationality: string | null;
}

export const getPlayers = async (): Promise<Player[]> => {
  try {
    const response = await api.get<Player[]>('/players');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error al obtener el plantel:', error);
    return [];
  }
};

export const getPlayer = async (id: string): Promise<Player | null> => {
  try {
    const response = await api.get<Player>(`/players/${id}`);
    return response.data ?? null;
  } catch (error) {
    console.error('Error al obtener el jugador:', error);
    return null;
  }
};

export const deletePlayer = async (id: string): Promise<void> => {
  await api.delete(`/players/${id}`);
};

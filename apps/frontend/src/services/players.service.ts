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
  status: string;
  nickname: string | null;
  preferredFoot: string | null;
  joinedAt: string | null;
  injuryType: string | null;
  injuryZone: string | null;
  injuryReturnDate: string | null;
}

export interface PlayerStats {
  height: string | null;
  weight: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  birthCountry: string | null;
  appearances: number;
  lineups: number;
  minutes: number;
  rating: string | null;
  goals: number;
  penaltyGoals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  season: number;
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

export const getPlayerStats = async (id: string): Promise<PlayerStats | null> => {
  try {
    const response = await api.get<PlayerStats>(`/players/${id}/stats`);
    return response.data ?? null;
  } catch {
    return null;
  }
};

export const deletePlayer = async (id: string): Promise<void> => {
  await api.delete(`/players/${id}`);
};

export interface LeaderboardEntry {
  id: string;
  name: string;
  position: string;
  number: number | null;
  photo: string | null;
  goals: number;
  assists: number;
  appearances: number;
  season: number;
}

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const response = await api.get<LeaderboardEntry[]>('/players/leaderboard');
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
};

export const createPlayer = async (data: {
  name: string;
  position: string;
  number?: number;
  age?: number;
  photo?: string;
  nationality?: string;
}): Promise<Player> => {
  const response = await api.post<Player>('/players', data);
  return response.data;
};

export const updatePlayer = async (
  id: string,
  data: Partial<Omit<Player, 'id'>>,
): Promise<Player> => {
  const response = await api.patch<Player>(`/players/${id}`, data);
  return response.data;
};

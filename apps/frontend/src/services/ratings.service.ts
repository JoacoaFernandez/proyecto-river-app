import { api } from './api';

export interface PlayerRating {
  id: string;
  matchId: string;
  playerId: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
  player: {
    id: string;
    name: string;
    number: number | null;
    position: string;
    photo: string | null;
  };
}

export const getRatingsByMatch = async (matchId: string): Promise<PlayerRating[]> => {
  try {
    const res = await api.get<PlayerRating[]>(`/matches/${matchId}/ratings`);
    return res.data ?? [];
  } catch {
    return [];
  }
};

export const upsertRating = async (matchId: string, playerId: string, rating: number): Promise<PlayerRating> => {
  const res = await api.put(`/matches/${matchId}/ratings/${playerId}`, { rating });
  return res.data;
};

export const deleteRating = async (matchId: string, playerId: string): Promise<void> => {
  await api.delete(`/matches/${matchId}/ratings/${playerId}`);
};

// apps/frontend/src/services/matches.service.ts
import { api } from './api';

export interface Match {
  id: string;
  type: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  minute: number | null;
  date: string;
  competition: string | null;
  stadium: string | null;
  manualOverride: boolean;
}

export const getLatestMatch = async () => {
  try {
    const res = await api.get('/matches/latest');
    return res.data;
  } catch (err) {
    console.error('Error getLatestMatch', err);
    return null;
  }
};

export const getUpcomingMatches = async (limit = 10) => {
  try {
    const res = await api.get(`/matches/upcoming?limit=${limit}`);
    return res.data || [];
  } catch (err) {
    console.error('Error getUpcomingMatches', err);
    return [];
  }
};

export const getPastMatches = async (limit = 20) => {
  try {
    const res = await api.get(`/matches/past?limit=${limit}`);
    return res.data || [];
  } catch (err) {
    console.error('Error getPastMatches', err);
    return [];
  }
};

// ── Admin ────────────────────────────────────────────────────────────────────

export const getAllMatchesAdmin = async (): Promise<Match[]> => {
  const res = await api.get('/matches');
  return res.data || [];
};

export const createMatchAdmin = async (data: {
  homeTeam: string;
  awayTeam: string;
  date: string;
  competition?: string;
  stadium?: string;
}): Promise<Match> => {
  const res = await api.post('/matches', data);
  return res.data;
};

export const updateMatchAdmin = async (
  id: string,
  data: Partial<Pick<Match, 'status' | 'homeScore' | 'awayScore' | 'minute' | 'competition' | 'stadium' | 'date'>>,
): Promise<Match> => {
  const res = await api.patch(`/matches/${id}`, data);
  return res.data;
};

export const deleteMatchAdmin = async (id: string): Promise<void> => {
  await api.delete(`/matches/${id}`);
};

export const getH2H = async (rival: string, limit = 6): Promise<Match[]> => {
  try {
    const res = await api.get(`/matches/h2h?rival=${encodeURIComponent(rival)}&limit=${limit}`);
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
};

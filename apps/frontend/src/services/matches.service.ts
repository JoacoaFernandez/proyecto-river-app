// apps/frontend/src/services/matches.service.ts
import { api } from './api';

export interface MatchEvent {
  id: string;
  type: string;
  minute: number;
  team: string;
  playerName: string | null;
  playerInName: string | null;
  assistName: string | null;
  detail: string | null;
  period: number;
}

export interface MatchStatSide { home: number | null; away: number | null; }

export interface MatchStatistics {
  homeTeam: string;
  awayTeam: string;
  possession: MatchStatSide;
  shotsOnTarget: MatchStatSide;
  totalShots: MatchStatSide;
  fouls: MatchStatSide;
  yellowCards: MatchStatSide;
  redCards: MatchStatSide;
  corners: MatchStatSide;
  saves: MatchStatSide;
  offsides?: MatchStatSide;
}

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
  aiPrediction?: string | null;
  events?: MatchEvent[];
  statistics?: MatchStatistics | null;
  photos?: string[] | null;
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

export const updateMatchStatistics = async (id: string, stats: MatchStatistics): Promise<void> => {
  await api.patch(`/matches/${id}/statistics`, stats);
};

export const updateMatchPhotos = async (id: string, photos: string[]): Promise<void> => {
  await api.patch(`/matches/${id}/photos`, { photos });
};

export const getMatchById = async (id: string): Promise<Match | null> => {
  try {
    const res = await api.get(`/matches/by-id/${id}`);
    return res.data ?? null;
  } catch {
    return null;
  }
};

export const getH2H = async (rival: string, limit = 6): Promise<Match[]> => {
  try {
    const res = await api.get(`/matches/h2h?rival=${encodeURIComponent(rival)}&limit=${limit}`);
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
};

// ── Match Events ──────────────────────────────────────────────────────────────

export const getMatchEvents = async (matchId: string): Promise<MatchEvent[]> => {
  try {
    const res = await api.get(`/matches/${matchId}/events`);
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
};

export const createMatchEventAdmin = async (
  matchId: string,
  data: Omit<MatchEvent, 'id'>,
): Promise<MatchEvent> => {
  const res = await api.post(`/matches/${matchId}/events`, data);
  return res.data;
};

export const deleteMatchEventAdmin = async (
  matchId: string,
  eventId: string,
): Promise<void> => {
  await api.delete(`/matches/${matchId}/events/${eventId}`);
};

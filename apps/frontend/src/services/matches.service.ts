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

export interface MatchLineupPlayer {
  name: string;
  jersey: number | null;
  position: string;
  starter: boolean;
}
export interface MatchLineups {
  home: { team: string; players: MatchLineupPlayer[] };
  away: { team: string; players: MatchLineupPlayer[] };
  source: 'espn' | 'none';
}

export const getMatchLineups = async (id: string): Promise<MatchLineups | null> => {
  try {
    const res = await api.get<MatchLineups>(`/matches/by-id/${id}/lineups`);
    return res.data;
  } catch {
    return null;
  }
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

export interface SeasonProgressionEntry {
  matchday: number;
  date: string;
  opponent: string;
  isHome: boolean;
  riverScore: number;
  rivalScore: number;
  result: 'W' | 'D' | 'L';
  pointsThisMatch: number;
  accumulatedPoints: number;
}

export const getSeasonsAvailable = async (): Promise<number[]> => {
  try {
    const res = await api.get<number[]>('/matches/seasons-available');
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
};

export const getSeasonProgression = async (year: number): Promise<SeasonProgressionEntry[]> => {
  try {
    const res = await api.get<SeasonProgressionEntry[]>('/matches/season-progression', { params: { year } });
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
};

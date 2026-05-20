// apps/frontend/src/services/formations.service.ts
import { api } from './api';

export type SlotRole = 'GK' | 'DEF' | 'MID' | 'ATK';

export interface PitchSlot {
  x: number;
  y: number;
  role: SlotRole;
}

export interface LineupPlayer {
  id: string;
  name: string;
  number: number | null;
  photo: string | null;
  nationality: string | null;
  position: string;
  status?: string;
  virtual?: boolean;
}

export interface LineupEntry extends PitchSlot {
  player: LineupPlayer | null;
}

export interface PlayerAlert {
  playerId: string;
  type: 'injury' | 'suspension';
  detail: string;
  replacementId?: string;
}

export interface LineupResponse {
  scheme: string;
  schemes: string[];
  lineup: LineupEntry[];
  bench: LineupPlayer[];
  source: 'last-match' | 'algorithm';
  lastMatchInfo?: { opponent: string; date: string; competition: string };
  alerts: PlayerAlert[];
}

export interface FormHistoryEntry {
  matchId: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  competition: string | null;
  scheme: string | null;
}

export const getLineup = async (scheme?: string, refresh = false): Promise<LineupResponse | null> => {
  try {
    const params: Record<string, string> = {};
    if (scheme) params.scheme = scheme;
    if (refresh) params.refresh = 'true';
    const response = await api.get<LineupResponse>('/formations/lineup', { params });
    return response.data ?? null;
  } catch (error) {
    console.error('Error al obtener lineup:', error);
    return null;
  }
};

export const getFormationHistory = async (limit = 12): Promise<FormHistoryEntry[]> => {
  try {
    const { data } = await api.get<FormHistoryEntry[]>(`/formations/history?limit=${limit}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export interface SavedFormation {
  id: string;
  matchId: string;
  scheme: string;
  type: 'probable' | 'confirmada';
  lineup: SavedSlot[] | null;
}

export interface SavedSlot {
  x: number;
  y: number;
  role: SlotRole;
  playerId: string | null;
}

export const getFormationForMatch = async (matchId: string): Promise<SavedFormation | null> => {
  try {
    const { data } = await api.get<SavedFormation>(`/formations/match/${matchId}`);
    return data ?? null;
  } catch {
    return null;
  }
};

export const saveFormationForMatch = async (
  matchId: string,
  scheme: string,
  type: 'probable' | 'confirmada',
  lineup: SavedSlot[],
): Promise<SavedFormation> => {
  const { data } = await api.put<SavedFormation>(`/formations/match/${matchId}`, { scheme, type, lineup });
  return data;
};

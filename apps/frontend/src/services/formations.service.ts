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

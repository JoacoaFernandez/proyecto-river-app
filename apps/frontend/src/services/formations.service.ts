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
}

export interface LineupEntry extends PitchSlot {
  player: LineupPlayer | null;
}

export interface LineupResponse {
  scheme: string;
  schemes: string[];
  lineup: LineupEntry[];
  bench: LineupPlayer[];
}

export const getLineup = async (scheme?: string): Promise<LineupResponse | null> => {
  try {
    const response = await api.get<LineupResponse>('/formations/lineup', {
      params: scheme ? { scheme } : {},
    });
    return response.data ?? null;
  } catch (error) {
    console.error('Error al obtener lineup:', error);
    return null;
  }
};

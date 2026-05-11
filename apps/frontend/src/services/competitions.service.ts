// apps/frontend/src/services/competitions.service.ts
import { api } from './api';

export interface Competition {
  code: string;
  name: string;
  shortName: string;
  type: 'league' | 'cup';
  country: string;
  hasStandings: boolean;
}

export interface StandingRow {
  pos: number;
  team: string;
  teamLogo: string | null;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dif: number;
  pts: number;
}

export interface StandingsGroup {
  /** "Zona A", "Zona B", etc. */
  name: string;
  /** "A", "B", etc. */
  key: string;
  standings: StandingRow[];
}

export interface PlayoffSeed {
  team: string;
  teamLogo: string | null;
  /** "A1", "B8", etc. */
  seed: string;
}

export type PlayoffRound = 'octavos' | 'cuartos' | 'semis' | 'final';
export type PlayoffStatus = 'pending' | 'scheduled' | 'live' | 'finished';

export interface PlayoffMatch {
  round: PlayoffRound;
  slot: number;
  home: PlayoffSeed | null;
  away: PlayoffSeed | null;
  homeScore: number | null;
  awayScore: number | null;
  status: PlayoffStatus;
  date: string | null;
  winner: 'home' | 'away' | null;
  penaltyDecided: boolean;
}

export interface PlayoffsBracket {
  format: string;
  rounds: {
    octavos: PlayoffMatch[];
    cuartos: PlayoffMatch[];
    semis: PlayoffMatch[];
    final: PlayoffMatch[];
  };
}

export interface StandingsResponse {
  meta: Competition;
  groups: StandingsGroup[];
  playoffs: PlayoffsBracket | null;
}

export const getCompetitions = async (): Promise<Competition[]> => {
  try {
    const response = await api.get<Competition[]>('/competitions');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error al obtener competiciones:', error);
    return [];
  }
};

export const getStandings = async (code: string): Promise<StandingsResponse | null> => {
  try {
    const response = await api.get<StandingsResponse>(`/competitions/${encodeURIComponent(code)}/standings`);
    return response.data ?? null;
  } catch (error) {
    console.error('Error al obtener standings:', error);
    return null;
  }
};

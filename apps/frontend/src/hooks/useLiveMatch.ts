// apps/frontend/src/hooks/useLiveMatch.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ScoringPlay {
  team: string;
  scorer: string;
  minute: string;
  period: number;
  type: 'goal' | 'own-goal' | 'penalty';
}

export interface LiveMatchData {
  id: string;
  status: string;
  displayClock: string;
  period: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  competition: string;
  venue: string;
  scoringPlays: ScoringPlay[];
}

const SOCKET_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useLiveMatch() {
  // undefined = cargando, null = no hay partido en vivo, data = partido en vivo
  const [match, setMatch] = useState<LiveMatchData | null | undefined>(undefined);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket: Socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join:live');
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('live:update', (data: LiveMatchData | null) => {
      setMatch(data ?? null);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { match, connected, loading: match === undefined };
}

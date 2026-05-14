// apps/frontend/src/hooks/useLiveMatch.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { MatchEvent } from '../services/matches.service';

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
  events: MatchEvent[];
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
      if (data) {
        // Ensure events array exists (backward compat)
        data.events = data.events ?? [];
      }
      setMatch(data ?? null);
    });

    // Individual event broadcast from admin
    socket.on('live:event', (event: MatchEvent) => {
      setMatch((prev) => {
        if (!prev) return prev;
        const exists = prev.events.some((e) => e.id === event.id);
        if (exists) return prev;
        const newEvents = [...prev.events, event].sort(
          (a, b) => a.period - b.period || a.minute - b.minute,
        );
        return { ...prev, events: newEvents };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { match, connected, loading: match === undefined };
}

// apps/frontend/src/hooks/useMatchNotifications.ts
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useMatchNotifications() {
  const supported = 'Notification' in window;
  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : 'denied',
  );
  const hadMatchRef = useRef(false);

  const requestPermission = async () => {
    if (!supported) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  useEffect(() => {
    if (permission !== 'granted') return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => socket.emit('join:live'));

    socket.on('live:update', (data: { homeTeam: string; awayTeam: string; homeScore: number; awayScore: number; competition: string } | null) => {
      const hasMatch = data !== null;

      if (hasMatch && !hadMatchRef.current) {
        new Notification('⚽ ¡River está jugando!', {
          body: `${data.homeTeam} ${data.homeScore} - ${data.awayScore} ${data.awayTeam} · ${data.competition}`,
          icon: '/favicon.ico',
          tag: 'river-live',
          requireInteraction: false,
        });
      }

      hadMatchRef.current = hasMatch;
    });

    return () => {
      socket.disconnect();
    };
  }, [permission]);

  return { supported, permission, requestPermission };
}

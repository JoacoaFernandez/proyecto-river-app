import { useState, useEffect } from 'react';
import { getTeamLogoUrl, loadTeamLogos } from '../utils/teamLogos';

const listeners = new Set<() => void>();
let globalLoaded = false;

loadTeamLogos().then(() => {
  globalLoaded = true;
  listeners.forEach((fn) => fn());
});

export function useTeamLogo(teamName: string): string | null {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (globalLoaded) return;
    const notify = () => forceUpdate((n) => n + 1);
    listeners.add(notify);
    return () => { listeners.delete(notify); };
  }, []);

  return getTeamLogoUrl(teamName);
}

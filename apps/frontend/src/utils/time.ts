// apps/frontend/src/utils/time.ts

/**
 * Devuelve una etiqueta tipo "Hace 5 min", "Hace 2 hs", "Hace 3 días" o la fecha completa
 * si pasaron más de 7 días.
 */
export function timeAgo(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'Recién';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? 'hora' : 'hs'}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;

  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

import { Heart } from 'lucide-react';
import { useFavorite } from '../hooks/useFavorite';
import type { FavoriteType } from '../services/favorites.service';

interface Props {
  type: FavoriteType;
  targetId: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function FavoriteButton({ type, targetId, size = 'md', className = '' }: Props) {
  const { isFav, loading, toggling, toggle } = useFavorite(type, targetId);

  if (loading) return null;

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const btnSize = size === 'sm' ? 'p-1.5' : 'p-2';

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
      disabled={toggling}
      title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      className={`${btnSize} rounded-full transition-all ${
        isFav
          ? 'bg-red-950/60 text-riverRed border border-red-900/50 hover:bg-red-950/80'
          : 'bg-neutral-900/80 text-neutral-500 border border-neutral-800 hover:text-riverRed hover:border-red-900/50'
      } ${className}`}
    >
      <Heart className={`${iconSize} ${isFav ? 'fill-current' : ''}`} />
    </button>
  );
}

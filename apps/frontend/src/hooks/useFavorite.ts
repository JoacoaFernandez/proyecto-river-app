import { useState, useEffect } from 'react';
import { checkFavorite, toggleFavorite } from '../services/favorites.service';
import type { FavoriteType } from '../services/favorites.service';

export function useFavorite(type: FavoriteType, targetId: string) {
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    checkFavorite(type, targetId)
      .then(setIsFav)
      .finally(() => setLoading(false));
  }, [type, targetId]);

  const toggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const next = await toggleFavorite(type, targetId);
      setIsFav(next);
    } finally {
      setToggling(false);
    }
  };

  return { isFav, loading, toggling, toggle };
}

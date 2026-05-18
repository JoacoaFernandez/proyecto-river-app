import { api } from './api';

export type FavoriteType = 'player' | 'news' | 'match';

export interface Favorite {
  id: string;
  type: FavoriteType;
  targetId: string;
  createdAt: string;
}

export const getMyFavorites = async (type?: FavoriteType): Promise<Favorite[]> => {
  try {
    const url = type ? `/favorites?type=${type}` : '/favorites';
    const res = await api.get(url);
    return res.data || [];
  } catch {
    return [];
  }
};

export const checkFavorite = async (type: FavoriteType, targetId: string): Promise<boolean> => {
  try {
    const res = await api.get(`/favorites/${type}/${targetId}`);
    return res.data.isFavorite;
  } catch {
    return false;
  }
};

export const toggleFavorite = async (type: FavoriteType, targetId: string): Promise<boolean> => {
  const res = await api.post(`/favorites/${type}/${targetId}`);
  return res.data.isFavorite;
};

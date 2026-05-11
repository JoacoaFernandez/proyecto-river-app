import { api } from './api';

export interface AppNotification {
  id: string;
  type: 'news' | 'match_live' | 'match_result' | 'match_upcoming';
  title: string;
  body: string;
  createdAt: string;
  link?: string;
  imageUrl?: string | null;
}

export const getNotifications = async (): Promise<AppNotification[]> => {
  try {
    const res = await api.get<AppNotification[]>('/notifications');
    return res.data ?? [];
  } catch {
    return [];
  }
};

const STORAGE_KEY = 'river_notif_read_at';

export const getLastReadAt = (): number =>
  parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);

export const markAllRead = () =>
  localStorage.setItem(STORAGE_KEY, Date.now().toString());

export const countUnread = (notifications: AppNotification[]): number => {
  const lastRead = getLastReadAt();
  return notifications.filter((n) => new Date(n.createdAt).getTime() > lastRead).length;
};

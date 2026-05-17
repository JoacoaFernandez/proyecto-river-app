// apps/frontend/src/services/me.service.ts
import { api } from './api';

export interface CurrentUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: 'user' | 'editor' | 'admin' | string;
  created_at: string;
  points: number;
  city: string | null;
  country: string | null;
  fanSince: number | null;
  notifGoals: boolean;
  notifMatch: boolean;
  notifNews: boolean;
  quietFrom: number | null;
  quietTo: number | null;
}

let cached: CurrentUser | null = null;
let inflight: Promise<CurrentUser | null> | null = null;

export async function getCurrentUser(forceRefresh = false): Promise<CurrentUser | null> {
  if (!forceRefresh && cached) return cached;
  if (!forceRefresh && inflight) return inflight;

  inflight = api
    .get<CurrentUser>('/auth/me')
    .then((res) => {
      cached = res.data;
      return cached;
    })
    .catch(() => {
      cached = null;
      return null;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function clearCurrentUser() {
  cached = null;
  inflight = null;
}

export async function updateCurrentUser(data: {
  display_name?: string;
  avatar_url?: string;
  city?: string | null;
  country?: string | null;
  fanSince?: number | null;
  notifGoals?: boolean;
  notifMatch?: boolean;
  notifNews?: boolean;
  quietFrom?: number | null;
  quietTo?: number | null;
}): Promise<CurrentUser | null> {
  const res = await api.patch<CurrentUser>('/auth/me', data);
  cached = res.data;
  return cached;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/auth/change-password', { currentPassword, newPassword });
}

export async function deleteAccount(): Promise<void> {
  await api.delete('/auth/me');
}

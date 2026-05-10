// apps/frontend/src/services/me.service.ts
import { api } from './api';

export interface CurrentUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: 'user' | 'editor' | 'admin' | string;
  created_at: string;
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

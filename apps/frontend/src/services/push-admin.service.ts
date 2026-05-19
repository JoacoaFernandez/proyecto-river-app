// apps/frontend/src/services/push-admin.service.ts
import { api } from './api';

export type PushSegment =
  | 'all'
  | 'authenticated'
  | 'active7d'
  | 'notifGoals'
  | 'notifMatch'
  | 'notifNews';

export interface BroadcastResult {
  sent: number;
  failed: number;
  total: number;
}

export const getSegmentCount = async (segment: PushSegment): Promise<number> => {
  try {
    const res = await api.get<{ count: number }>('/push/segment-count', { params: { segment } });
    return res.data?.count ?? 0;
  } catch {
    return 0;
  }
};

export const broadcastPush = async (params: {
  title: string;
  body: string;
  link?: string;
  segment: PushSegment;
}): Promise<BroadcastResult> => {
  const res = await api.post<BroadcastResult>('/push/broadcast', params);
  return res.data;
};

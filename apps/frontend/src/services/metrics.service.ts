// apps/frontend/src/services/metrics.service.ts
import { api } from './api';

export interface MetricsSnapshot {
  timestamp: string;
  process: {
    uptimeSeconds: number;
    nodeVersion: string;
    memoryMb: number;
  };
  counts: {
    users: number;
    bannedUsers: number;
    newUsers24h: number;
    matches: number;
    news: number;
    draftNews: number;
    comments: number;
    hiddenComments: number;
    reportedComments: number;
    predictions: number;
    wonPredictions: number;
    favorites: number;
    ratings: number;
    activeSurveys: number;
    liveChatMsgs24h: number;
  };
  recentNews: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    urgent: boolean;
  }>;
  recentReportedComments: Array<{
    id: string;
    body: string;
    reportedAt: string | null;
    user: { display_name: string };
  }>;
}

export const getMetrics = async (): Promise<MetricsSnapshot | null> => {
  try {
    const res = await api.get<MetricsSnapshot>('/admin/metrics');
    return res.data ?? null;
  } catch (err) {
    console.error('Error al obtener metricas:', err);
    return null;
  }
};

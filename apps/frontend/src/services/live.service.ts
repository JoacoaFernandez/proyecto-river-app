// apps/frontend/src/services/live.service.ts
import { api } from './api';

export const getLiveDashboard = async () => {
  try {
    const res = await api.get('/live/dashboard');
    return res.data;
  } catch (error) {
    console.error('Error fetching live dashboard:', error);
    return null;
  }
};

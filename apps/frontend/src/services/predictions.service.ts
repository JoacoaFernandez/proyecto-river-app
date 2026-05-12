import { api } from './api';

export interface Prediction {
  id: string;
  matchId: string;
  userId: string;
  choice: 'home' | 'draw' | 'away';
  status: 'pending' | 'won' | 'lost';
  match?: any; // The full match object returned from backend
}

export interface RankingUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
  points: number;
}

export async function createPrediction(matchId: string, choice: 'home' | 'draw' | 'away'): Promise<Prediction> {
  const { data } = await api.post('/predictions', { matchId, choice });
  return data;
}

export async function getMyPrediction(matchId: string): Promise<Prediction | null> {
  try {
    const { data } = await api.get(`/predictions/me/${matchId}`);
    return data;
  } catch (error) {
    return null;
  }
}

export async function getMyAllPredictions(): Promise<Prediction[]> {
  try {
    const { data } = await api.get('/predictions/me');
    return data;
  } catch (error) {
    return [];
  }
}

export async function getRanking(): Promise<RankingUser[]> {
  const { data } = await api.get('/predictions/ranking');
  return data;
}

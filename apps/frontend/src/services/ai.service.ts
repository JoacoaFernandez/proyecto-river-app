import { api } from './api';

export const getMatchPrediction = async (matchId: string): Promise<string | null> => {
  try {
    const res = await api.get(`/ai/prediction/${matchId}`);
    return res.data.prediction;
  } catch (err) {
    console.error('Error fetching AI prediction:', err);
    return null;
  }
};

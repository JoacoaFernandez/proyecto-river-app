import { api } from './api';

export interface SurveyOption {
  id: string;
  label: string;
  count: number;
  percent: number;
}

export interface SurveyResult {
  id: string;
  question: string;
  active: boolean;
  total: number;
  options: SurveyOption[];
}

export interface SurveySummary {
  id: string;
  question: string;
  active: boolean;
  createdAt: string;
  closedAt: string | null;
  _count: { votes: number };
}

export const getActiveSurvey = async (): Promise<SurveyResult | null> => {
  try {
    const res = await api.get('/surveys/active');
    return res.data ?? null;
  } catch {
    return null;
  }
};

export const getSurveyResults = async (id: string): Promise<SurveyResult> => {
  const res = await api.get(`/surveys/${id}/results`);
  return res.data;
};

export const getMyVote = async (surveyId: string): Promise<{ optionId: string } | null> => {
  try {
    const res = await api.get(`/surveys/${surveyId}/my-vote`);
    return res.data ?? null;
  } catch {
    return null;
  }
};

export const voteSurvey = async (surveyId: string, optionId: string): Promise<void> => {
  await api.post(`/surveys/${surveyId}/vote`, { optionId });
};

// Admin
export const getAllSurveys = async (): Promise<SurveySummary[]> => {
  const res = await api.get('/surveys');
  return res.data || [];
};

export const createSurvey = async (data: {
  question: string;
  options: { id: string; label: string }[];
}): Promise<SurveySummary> => {
  const res = await api.post('/surveys', data);
  return res.data;
};

export const closeSurvey = async (id: string): Promise<void> => {
  await api.patch(`/surveys/${id}/close`);
};

export const deleteSurvey = async (id: string): Promise<void> => {
  await api.delete(`/surveys/${id}`);
};

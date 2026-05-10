// apps/frontend/src/services/news.service.ts
import { api } from './api';

export interface NewsAuthor {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  category: string;
  slug: string;
  url: string | null;
  status: string;
  publishedAt: string | null;
  authorId: string;
  author: NewsAuthor;
  createdAt: string;
  updatedAt: string;
}

export const getNews = async (): Promise<NewsItem[]> => {
  try {
    const response = await api.get<NewsItem[]>('/news');
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error al obtener las noticias:', error);
    return [];
  }
};

export const getNewsById = async (id: string): Promise<NewsItem | null> => {
  try {
    const response = await api.get<NewsItem>(`/news/${id}`);
    return response.data ?? null;
  } catch (error) {
    console.error('Error al obtener la noticia:', error);
    return null;
  }
};

export interface CreateNewsInput {
  title: string;
  body: string;
  category?: string;
  status?: 'draft' | 'published';
}

export const createNews = async (input: CreateNewsInput): Promise<NewsItem> => {
  const response = await api.post<NewsItem>('/news', input);
  return response.data;
};

export const deleteNews = async (id: string): Promise<void> => {
  await api.delete(`/news/${id}`);
};

export const triggerAiNews = async (): Promise<unknown> => {
  const response = await api.post('/news/trigger-ai');
  return response.data;
};

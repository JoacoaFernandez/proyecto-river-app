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
  imageUrl: string | null;
  status: string;
  publishedAt: string | null;
  authorId: string;
  author: NewsAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface NewsComment {
  id: string;
  newsId: string;
  userId: string;
  body: string;
  createdAt: string;
  user: { id: string; display_name: string; avatar_url: string | null };
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
  imageUrl?: string;
}

export const createNews = async (input: CreateNewsInput): Promise<NewsItem> => {
  const response = await api.post<NewsItem>('/news', input);
  return response.data;
};

export const updateNews = async (
  id: string,
  data: Partial<Pick<NewsItem, 'title' | 'body' | 'category' | 'status' | 'imageUrl'>>,
): Promise<NewsItem> => {
  const res = await api.patch<NewsItem>(`/news/${id}`, data);
  return res.data;
};

export const deleteNews = async (id: string): Promise<void> => {
  await api.delete(`/news/${id}`);
};

export const triggerAiNews = async (): Promise<unknown> => {
  const response = await api.post('/news/trigger-ai');
  return response.data;
};

// ── Comentarios ───────────────────────────────────────────────────────────────

export const getComments = async (newsId: string): Promise<NewsComment[]> => {
  try {
    const res = await api.get<NewsComment[]>(`/news/${newsId}/comments`);
    return res.data ?? [];
  } catch {
    return [];
  }
};

export const addComment = async (newsId: string, body: string): Promise<NewsComment> => {
  const res = await api.post<NewsComment>(`/news/${newsId}/comments`, { body });
  return res.data;
};

export const deleteComment = async (newsId: string, commentId: string): Promise<void> => {
  await api.delete(`/news/${newsId}/comments/${commentId}`);
};

// ── Likes ─────────────────────────────────────────────────────────────────────

export const toggleLike = async (newsId: string): Promise<{ liked: boolean; count: number }> => {
  const res = await api.post<{ liked: boolean; count: number }>(`/news/${newsId}/like`);
  return res.data;
};

export const getLikes = async (newsId: string): Promise<{ liked: boolean; count: number }> => {
  try {
    const res = await api.get<{ liked: boolean; count: number }>(`/news/${newsId}/likes`);
    return res.data;
  } catch {
    return { liked: false, count: 0 };
  }
};

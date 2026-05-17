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
  urgent: boolean;
}

export interface NewsComment {
  id: string;
  newsId: string;
  userId: string;
  body: string;
  createdAt: string;
  parentId: string | null;
  reportedAt: string | null;
  user: { id: string; display_name: string; avatar_url: string | null };
  replies?: NewsComment[];
  _count?: { likes: number };
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

export const getRelatedNews = async (newsId: string): Promise<NewsItem[]> => {
  try {
    const res = await api.get<NewsItem[]>(`/news/${newsId}/related`);
    return res.data ?? [];
  } catch {
    return [];
  }
};

export interface CreateNewsInput {
  title: string;
  body: string;
  category?: string;
  status?: 'draft' | 'published' | 'scheduled';
  imageUrl?: string;
  urgent?: boolean;
  publishedAt?: string;
}

export const createNews = async (input: CreateNewsInput): Promise<NewsItem> => {
  const response = await api.post<NewsItem>('/news', input);
  return response.data;
};

export const updateNews = async (
  id: string,
  data: Partial<Pick<NewsItem, 'title' | 'body' | 'category' | 'status' | 'imageUrl' | 'urgent'> & { publishedAt?: string }>,
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

export const addComment = async (
  newsId: string,
  body: string,
  parentId?: string,
): Promise<NewsComment> => {
  const res = await api.post<NewsComment>(`/news/${newsId}/comments`, { body, parentId });
  return res.data;
};

export const deleteComment = async (newsId: string, commentId: string): Promise<void> => {
  await api.delete(`/news/${newsId}/comments/${commentId}`);
};

export const reportComment = async (newsId: string, commentId: string): Promise<void> => {
  await api.post(`/news/${newsId}/comments/${commentId}/report`);
};

export const toggleCommentLike = async (
  newsId: string,
  commentId: string,
): Promise<{ liked: boolean; count: number }> => {
  const res = await api.post<{ liked: boolean; count: number }>(
    `/news/${newsId}/comments/${commentId}/like`,
  );
  return res.data;
};

export interface ReportedComment {
  id: string;
  body: string;
  reportedAt: string | null;
  hidden: boolean;
  newsId: string;
  userId: string;
  user: { id: string; display_name: string; avatar_url: string | null; isBanned: boolean };
  news: { id: string; title: string };
}

export const getReportedComments = async (): Promise<ReportedComment[]> => {
  try {
    const res = await api.get<ReportedComment[]>('/news/reported-comments');
    return res.data ?? [];
  } catch {
    return [];
  }
};

export const getAllCommentsAdmin = async (): Promise<ReportedComment[]> => {
  try {
    const res = await api.get<ReportedComment[]>('/news/admin/all-comments');
    return res.data ?? [];
  } catch {
    return [];
  }
};

export const hideComment = async (commentId: string): Promise<void> => {
  await api.patch(`/news/comments/${commentId}/hide`);
};

export const unhideComment = async (commentId: string): Promise<void> => {
  await api.patch(`/news/comments/${commentId}/unhide`);
};

export const dismissReport = async (commentId: string): Promise<void> => {
  await api.patch(`/news/comments/${commentId}/dismiss`);
};

export const banUser = async (userId: string): Promise<void> => {
  await api.patch(`/news/users/${userId}/ban`);
};

export const unbanUser = async (userId: string): Promise<void> => {
  await api.patch(`/news/users/${userId}/unban`);
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

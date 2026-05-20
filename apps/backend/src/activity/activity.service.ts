import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ActivityAction =
  | 'login'
  | 'register'
  | 'role_change'
  | 'ban'
  | 'unban'
  | 'password_change'
  | 'profile_update';

export interface TimelineEntry {
  type: string;
  action: string;
  createdAt: string;
  detail?: string;
  meta?: Record<string, any> | null;
}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Registra una entrada en UserActivity. Nunca rompe el flujo principal. */
  async log(userId: string, action: ActivityAction, meta?: Record<string, any>): Promise<void> {
    try {
      await this.prisma.userActivity.create({
        data: { userId, action, meta: meta as any },
      });
    } catch (e: any) {
      this.logger.warn(`No se pudo loguear actividad ${action} para ${userId}: ${e?.message}`);
    }
  }

  /**
   * Devuelve la timeline combinada del usuario: UserActivity + derivados
   * (comentarios, predicciones, votos, likes, favoritos).
   */
  async getUserTimeline(userId: string, limit = 80): Promise<TimelineEntry[]> {
    const [activities, comments, predictions, votes, likes, favorites] = await Promise.all([
      this.prisma.userActivity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.comment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { news: { select: { title: true, slug: true } } },
      }),
      this.prisma.prediction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { match: { select: { homeTeam: true, awayTeam: true, date: true } } },
      }),
      this.prisma.surveyVote.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { survey: { select: { question: true } } },
      }),
      this.prisma.newsLike.findMany({
        where: { userId },
        take: 20,
        include: { news: { select: { title: true, createdAt: true, slug: true } } },
      }),
      this.prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const entries: TimelineEntry[] = [];

    for (const a of activities) {
      entries.push({
        type: 'system',
        action: a.action,
        createdAt: a.createdAt.toISOString(),
        meta: (a.meta as any) ?? null,
        detail: this.formatSystemAction(a.action, (a.meta as any) ?? {}),
      });
    }

    for (const c of comments) {
      entries.push({
        type: 'comment',
        action: c.hidden ? 'comment_hidden' : 'comment',
        createdAt: c.createdAt.toISOString(),
        detail: `Comentó en "${c.news?.title ?? 'noticia'}": ${c.body.slice(0, 80)}${c.body.length > 80 ? '…' : ''}`,
      });
    }

    for (const p of predictions) {
      entries.push({
        type: 'prediction',
        action: `prediction_${p.status}`,
        createdAt: p.createdAt.toISOString(),
        detail: `Predicción "${p.choice}" en ${p.match?.homeTeam} vs ${p.match?.awayTeam}`,
      });
    }

    for (const v of votes) {
      entries.push({
        type: 'survey_vote',
        action: 'survey_vote',
        createdAt: v.createdAt.toISOString(),
        detail: `Votó en encuesta: ${v.survey?.question ?? '—'}`,
      });
    }

    for (const l of likes) {
      entries.push({
        type: 'like',
        action: 'news_like',
        createdAt: (l.news?.createdAt ?? new Date()).toISOString(),
        detail: `Like en noticia "${l.news?.title ?? '—'}"`,
      });
    }

    for (const f of favorites) {
      entries.push({
        type: 'favorite',
        action: `favorite_${f.type}`,
        createdAt: f.createdAt.toISOString(),
        detail: `Agregó a favoritos un ${f.type}`,
      });
    }

    entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return entries.slice(0, limit);
  }

  private formatSystemAction(action: string, meta: Record<string, any>): string {
    switch (action) {
      case 'login':
        return 'Inicio de sesión';
      case 'register':
        return 'Registro de cuenta';
      case 'role_change':
        return `Cambio de rol${meta?.from ? ` (${meta.from} → ${meta.to})` : ''}`;
      case 'ban':
        return 'Usuario baneado';
      case 'unban':
        return 'Usuario desbaneado';
      case 'password_change':
        return 'Cambió su contraseña';
      case 'profile_update':
        return 'Editó su perfil';
      default:
        return action;
    }
  }
}

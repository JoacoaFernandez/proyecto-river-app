// apps/backend/src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const RIVER_RX = /river/i;

export interface AppNotification {
  id: string;
  type: 'news' | 'match_live' | 'match_result' | 'match_upcoming';
  title: string;
  body: string;
  createdAt: string;
  link?: string;
  imageUrl?: string | null;
}

const LIVE_STATUSES = new Set(['live', 'in_play', 'halftime', 'ht', 'et', 'bt', 'penalty', 'extra_time']);
const FINISHED_STATUSES = new Set(['finished', 'ft', 'aet', 'pen']);
const SCHEDULED_STATUSES = new Set(['scheduled', 'not_started', 'tbd']);

const DATE_FMT = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<AppNotification[]> {
    const [newsItems, matches] = await Promise.all([
      this.prisma.news.findMany({
        where: { status: 'published' },
        orderBy: { publishedAt: 'desc' },
        take: 8,
        select: { id: true, title: true, category: true, slug: true, imageUrl: true, publishedAt: true, createdAt: true },
      }),
      this.prisma.match.findMany({
        orderBy: { date: 'desc' },
        take: 20,
        select: {
          id: true, homeTeam: true, awayTeam: true,
          homeScore: true, awayScore: true,
          status: true, minute: true, competition: true,
          date: true, updatedAt: true,
        },
      }),
    ]);

    const notifications: AppNotification[] = [];

    for (const n of newsItems) {
      notifications.push({
        id: `news-${n.id}`,
        type: 'news',
        title: n.title,
        body: n.category,
        createdAt: (n.publishedAt ?? n.createdAt).toISOString(),
        link: `/noticias/${n.slug}`,
        imageUrl: n.imageUrl,
      });
    }

    for (const m of matches) {
      const isHome = RIVER_RX.test(m.homeTeam);
      const rival = isHome ? m.awayTeam : m.homeTeam;
      const rScore = isHome ? m.homeScore : m.awayScore;
      const oScore = isHome ? m.awayScore : m.homeScore;
      const statusLower = m.status.toLowerCase();

      if (LIVE_STATUSES.has(statusLower)) {
        notifications.push({
          id: `match-live-${m.id}`,
          type: 'match_live',
          title: `¡En vivo! River ${rScore ?? 0} - ${oScore ?? 0} ${rival}`,
          body: m.minute ? `Min. ${m.minute}` : (m.competition ?? 'Partido en curso'),
          createdAt: m.updatedAt.toISOString(),
          link: `/partidos/${m.id}`,
        });
      } else if (FINISHED_STATUSES.has(statusLower)) {
        const result =
          rScore != null && oScore != null
            ? rScore > oScore ? '✅ Victoria' : rScore < oScore ? '❌ Derrota' : '➡️ Empate'
            : '';
        notifications.push({
          id: `match-result-${m.id}`,
          type: 'match_result',
          title: `River ${rScore ?? '?'} - ${oScore ?? '?'} ${rival}`,
          body: [result, m.competition].filter(Boolean).join(' · '),
          createdAt: m.date.toISOString(),
          link: `/partidos/${m.id}`,
        });
      } else if (SCHEDULED_STATUSES.has(statusLower)) {
        notifications.push({
          id: `match-upcoming-${m.id}`,
          type: 'match_upcoming',
          title: `Próximo: River vs ${rival}`,
          body: [m.competition, DATE_FMT.format(m.date)].filter(Boolean).join(' · '),
          createdAt: m.date.toISOString(),
          link: `/partidos/${m.id}`,
        });
      }
    }

    return notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  }
}

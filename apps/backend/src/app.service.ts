import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

export interface AppNotification {
  id: string;
  type: 'news' | 'match_live' | 'match_result' | 'match_upcoming';
  title: string;
  body: string;
  createdAt: string;
  link?: string;
  imageUrl?: string | null;
}

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(): Promise<AppNotification[]> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // últimos 7 días
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [recentNews, liveMatches, recentResults, upcomingMatches] = await Promise.all([
      this.prisma.news.findMany({
        where: { status: 'published', publishedAt: { gte: since } },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, category: true, publishedAt: true, createdAt: true, imageUrl: true },
      }),
      this.prisma.match.findMany({
        where: { status: 'live' },
        take: 3,
      }),
      this.prisma.match.findMany({
        where: { status: 'finished', date: { gte: since } },
        orderBy: { date: 'desc' },
        take: 3,
      }),
      this.prisma.match.findMany({
        where: { status: 'scheduled', date: { lte: tomorrow, gte: new Date() } },
        orderBy: { date: 'asc' },
        take: 2,
      }),
    ]);

    const notifications: AppNotification[] = [];

    for (const m of liveMatches) {
      notifications.push({
        id: `live-${m.id}`,
        type: 'match_live',
        title: '⚽ Partido en vivo',
        body: `${m.homeTeam} ${m.homeScore ?? 0} - ${m.awayScore ?? 0} ${m.awayTeam}${m.minute ? ` · ${m.minute}'` : ''}`,
        createdAt: m.updatedAt.toISOString(),
        link: '/partidos/en-vivo',
      });
    }

    for (const m of upcomingMatches) {
      const fecha = new Date(m.date).toLocaleString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      notifications.push({
        id: `upcoming-${m.id}`,
        type: 'match_upcoming',
        title: '📅 Próximo partido',
        body: `${m.homeTeam} vs ${m.awayTeam} · ${fecha}`,
        createdAt: m.date.toISOString(),
        link: '/partidos/proximo',
      });
    }

    for (const m of recentResults) {
      const riverHome = /river plate/i.test(m.homeTeam);
      const our = riverHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
      const them = riverHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
      const result = our > them ? 'Victoria' : our < them ? 'Derrota' : 'Empate';
      const emoji = our > them ? '🏆' : our < them ? '😔' : '🤝';
      notifications.push({
        id: `result-${m.id}`,
        type: 'match_result',
        title: `${emoji} ${result}: ${m.homeTeam} ${m.homeScore ?? 0} - ${m.awayScore ?? 0} ${m.awayTeam}`,
        body: m.competition ? `${m.competition} · ${new Date(m.date).toLocaleDateString('es-AR')}` : new Date(m.date).toLocaleDateString('es-AR'),
        createdAt: m.date.toISOString(),
        link: '/partidos',
      });
    }

    for (const n of recentNews) {
      notifications.push({
        id: `news-${n.id}`,
        type: 'news',
        title: n.title,
        body: n.category,
        createdAt: (n.publishedAt ?? n.createdAt).toISOString(),
        link: `/noticias/${n.id}`,
        imageUrl: n.imageUrl,
      });
    }

    // Ordena por fecha descendente
    return notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSnapshot() {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      users, bannedUsers, newUsers24h,
      matches, news, draftNews,
      comments, hiddenComments, reportedComments,
      predictions, wonPredictions,
      favorites, ratings, surveys,
      liveChatMsgs24h,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isBanned: true } }),
      this.prisma.user.count({ where: { created_at: { gte: since24h } } }),
      this.prisma.match.count(),
      this.prisma.news.count(),
      this.prisma.news.count({ where: { status: 'draft' } }),
      this.prisma.comment.count(),
      this.prisma.comment.count({ where: { hidden: true } }),
      this.prisma.comment.count({ where: { reportedAt: { not: null }, hidden: false } }),
      this.prisma.prediction.count(),
      this.prisma.prediction.count({ where: { status: 'won' } }),
      this.prisma.favorite.count(),
      this.prisma.playerRating.count(),
      this.prisma.survey.count({ where: { active: true } }),
      this.prisma.liveChatMessage.count({ where: { createdAt: { gte: since24h } } }),
    ]);

    const recentNews = await this.prisma.news.findMany({
      where: { createdAt: { gte: since7d } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, status: true, createdAt: true, urgent: true },
    });

    const recentComments = await this.prisma.comment.findMany({
      where: { reportedAt: { not: null }, hidden: false },
      orderBy: { reportedAt: 'desc' },
      take: 5,
      select: { id: true, body: true, reportedAt: true, user: { select: { display_name: true } } },
    });

    return {
      timestamp: new Date().toISOString(),
      process: {
        uptimeSeconds: Math.round(process.uptime()),
        nodeVersion: process.version,
        memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      counts: {
        users, bannedUsers, newUsers24h,
        matches, news, draftNews,
        comments, hiddenComments, reportedComments,
        predictions, wonPredictions,
        favorites, ratings,
        activeSurveys: surveys,
        liveChatMsgs24h,
      },
      recentNews,
      recentReportedComments: recentComments,
    };
  }
}

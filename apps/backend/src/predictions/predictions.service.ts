import { Injectable, BadRequestException, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PredictionsService implements OnModuleInit {
  private readonly logger = new Logger(PredictionsService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.resolveAllPending();
  }

  async createOrUpdate(userId: string, matchId: string, choice: string) {
    if (!['home', 'draw', 'away'].includes(choice)) {
      throw new BadRequestException('Elección inválida');
    }

    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException('Partido no encontrado');
    }
    if (match.status !== 'scheduled' && match.status !== 'NS') {
      throw new BadRequestException('No puedes predecir un partido que ya comenzó o finalizó');
    }

    const prediction = await this.prisma.prediction.upsert({
      where: {
        userId_matchId: { userId, matchId },
      },
      update: { choice },
      create: {
        userId,
        matchId,
        choice,
      },
    });

    return prediction;
  }

  async getMyPrediction(userId: string, matchId: string) {
    return this.prisma.prediction.findUnique({
      where: {
        userId_matchId: { userId, matchId },
      },
    });
  }

  async getMyAllPredictions(userId: string) {
    return this.prisma.prediction.findMany({
      where: { userId },
      include: { match: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRanking() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        display_name: true,
        avatar_url: true,
        points: true,
      },
      orderBy: { points: 'desc' },
      take: 100,
    });
  }

  async getSummary(matchId: string) {
    const rows = await this.prisma.prediction.groupBy({
      by: ['choice'],
      where: { matchId },
      _count: { choice: true },
    });
    const counts: Record<string, number> = { home: 0, draw: 0, away: 0 };
    for (const r of rows) counts[r.choice] = r._count.choice;
    const total = counts.home + counts.draw + counts.away;
    const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;
    return {
      home: counts.home,
      draw: counts.draw,
      away: counts.away,
      total,
      homePct: pct(counts.home),
      drawPct: pct(counts.draw),
      awayPct: pct(counts.away),
    };
  }

  async resolvePredictions(matchId: string, homeScore: number, awayScore: number) {
    const actualResult = homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw';
    const predictions = await this.prisma.prediction.findMany({
      where: { matchId, status: 'pending' },
    });

    for (const p of predictions) {
      const won = p.choice === actualResult;
      await this.prisma.prediction.update({
        where: { id: p.id },
        data: { status: won ? 'won' : 'lost' },
      });
      if (won) {
        await this.prisma.user.update({
          where: { id: p.userId },
          data: { points: { increment: 10 } },
        });
      }
    }
    return predictions.length;
  }

  async resolveAllPending() {
    const finishedMatches = await this.prisma.match.findMany({
      where: {
        status: 'finished',
        homeScore: { not: null },
        awayScore: { not: null },
        predictions: { some: { status: 'pending' } },
      },
      select: { id: true, homeScore: true, awayScore: true, homeTeam: true, awayTeam: true },
    });

    if (finishedMatches.length === 0) return;

    this.logger.log(`Resolviendo predicciones pendientes para ${finishedMatches.length} partido(s) finalizado(s)...`);
    for (const m of finishedMatches) {
      const count = await this.resolvePredictions(m.id, m.homeScore!, m.awayScore!);
      this.logger.log(`  ✅ ${m.homeTeam} vs ${m.awayTeam}: ${count} predicción(es) resuelta(s)`);
    }
  }
}

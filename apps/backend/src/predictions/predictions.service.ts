import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PredictionsService {
  constructor(private prisma: PrismaService) {}

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
  }
}

// apps/backend/src/matches/match-events.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const GOAL_TYPES = ['goal', 'own-goal', 'penalty-goal'];

export interface CreateMatchEventDto {
  type: string;
  minute: number;
  team: string;
  playerName?: string;
  playerInName?: string;
  assistName?: string;
  detail?: string;
  period?: number;
}

@Injectable()
export class MatchEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByMatch(matchId: string) {
    return this.prisma.matchEvent.findMany({
      where: { matchId },
      orderBy: [{ period: 'asc' }, { minute: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(matchId: string, dto: CreateMatchEventDto) {
    // Verify match exists
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException(`Match ${matchId} not found`);

    const event = await this.prisma.matchEvent.create({
      data: {
        matchId,
        type: dto.type,
        minute: dto.minute,
        team: dto.team,
        playerName: dto.playerName ?? null,
        playerInName: dto.playerInName ?? null,
        assistName: dto.assistName ?? null,
        detail: dto.detail ?? null,
        period: dto.period ?? 1,
      },
    });

    // Auto-update match score if it's a goal event
    if (GOAL_TYPES.includes(dto.type)) {
      await this.recalculateScore(matchId);
    }

    return event;
  }

  async update(eventId: string, dto: Partial<CreateMatchEventDto>) {
    const existing = await this.prisma.matchEvent.findUnique({ where: { id: eventId } });
    if (!existing) throw new NotFoundException(`Event ${eventId} not found`);

    const updated = await this.prisma.matchEvent.update({
      where: { id: eventId },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.minute !== undefined && { minute: dto.minute }),
        ...(dto.team !== undefined && { team: dto.team }),
        ...(dto.playerName !== undefined && { playerName: dto.playerName }),
        ...(dto.playerInName !== undefined && { playerInName: dto.playerInName }),
        ...(dto.assistName !== undefined && { assistName: dto.assistName }),
        ...(dto.detail !== undefined && { detail: dto.detail }),
        ...(dto.period !== undefined && { period: dto.period }),
      },
    });

    // Recalculate if the type changed or a goal was edited
    if (GOAL_TYPES.includes(existing.type) || GOAL_TYPES.includes(dto.type ?? '')) {
      await this.recalculateScore(existing.matchId);
    }

    return updated;
  }

  async remove(eventId: string) {
    const existing = await this.prisma.matchEvent.findUnique({ where: { id: eventId } });
    if (!existing) throw new NotFoundException(`Event ${eventId} not found`);

    await this.prisma.matchEvent.delete({ where: { id: eventId } });

    // Recalculate score if a goal was removed
    if (GOAL_TYPES.includes(existing.type)) {
      await this.recalculateScore(existing.matchId);
    }

    return { deleted: true };
  }

  /** Recalculate homeScore/awayScore from goal events */
  private async recalculateScore(matchId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return;

    const goals = await this.prisma.matchEvent.findMany({
      where: { matchId, type: { in: GOAL_TYPES } },
    });

    let homeScore = 0;
    let awayScore = 0;

    for (const g of goals) {
      const isHomeTeamGoal = g.team.toLowerCase().includes(match.homeTeam.toLowerCase()) ||
        match.homeTeam.toLowerCase().includes(g.team.toLowerCase());

      if (g.type === 'own-goal') {
        // Own goal counts for the OTHER team
        if (isHomeTeamGoal) awayScore++;
        else homeScore++;
      } else {
        if (isHomeTeamGoal) homeScore++;
        else awayScore++;
      }
    }

    await this.prisma.match.update({
      where: { id: matchId },
      data: { homeScore, awayScore },
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}

  // Listado público de ratings de un partido (con datos del jugador para mostrar foto/nombre)
  async findByMatch(matchId: string) {
    return this.prisma.playerRating.findMany({
      where: { matchId },
      include: {
        player: {
          select: { id: true, name: true, number: true, position: true, photo: true },
        },
      },
      orderBy: { rating: 'desc' },
    });
  }

  // Upsert: si admin/editor mete nota, crea o actualiza
  async upsert(matchId: string, playerId: string, rating: number) {
    if (rating < 1 || rating > 10) {
      throw new Error('Rating debe estar entre 1 y 10');
    }
    return this.prisma.playerRating.upsert({
      where: { matchId_playerId: { matchId, playerId } },
      update: { rating },
      create: { matchId, playerId, rating },
    });
  }

  async remove(matchId: string, playerId: string) {
    const existing = await this.prisma.playerRating.findUnique({
      where: { matchId_playerId: { matchId, playerId } },
    });
    if (!existing) throw new NotFoundException('Rating no encontrado');
    return this.prisma.playerRating.delete({
      where: { matchId_playerId: { matchId, playerId } },
    });
  }
}

import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type FavoriteType = 'player' | 'news' | 'match';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async getUserFavorites(userId: string, type?: FavoriteType) {
    return this.prisma.favorite.findMany({
      where: { userId, ...(type ? { type } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async isFavorite(userId: string, type: FavoriteType, targetId: string) {
    const fav = await this.prisma.favorite.findUnique({
      where: { userId_type_targetId: { userId, type, targetId } },
    });
    return { isFavorite: !!fav };
  }

  async add(userId: string, type: FavoriteType, targetId: string) {
    try {
      return await this.prisma.favorite.create({
        data: { userId, type, targetId },
      });
    } catch {
      throw new ConflictException('Ya está en favoritos');
    }
  }

  async remove(userId: string, type: FavoriteType, targetId: string) {
    const fav = await this.prisma.favorite.findUnique({
      where: { userId_type_targetId: { userId, type, targetId } },
    });
    if (!fav) throw new NotFoundException('Favorito no encontrado');
    return this.prisma.favorite.delete({
      where: { userId_type_targetId: { userId, type, targetId } },
    });
  }

  async toggle(userId: string, type: FavoriteType, targetId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_type_targetId: { userId, type, targetId } },
    });
    if (existing) {
      await this.prisma.favorite.delete({
        where: { userId_type_targetId: { userId, type, targetId } },
      });
      return { isFavorite: false };
    }
    await this.prisma.favorite.create({ data: { userId, type, targetId } });
    return { isFavorite: true };
  }
}

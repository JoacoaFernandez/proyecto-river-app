// apps/backend/src/players/players.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Guardar un jugador de forma segura en Render
  async create(createPlayerDto: CreatePlayerDto) {
    return this.prisma.player.create({
      data: createPlayerDto,
    });
  }

  // 2. Traer todos los jugadores ordenados por su número de camiseta real
  async findAll() {
    return this.prisma.player.findMany({
      orderBy: {
        number: 'asc', // Corregido 'jerseyNumber'
      },
    });
  }

  // 3. Traer un solo jugador
  async findOne(id: string) {
    const player = await this.prisma.player.findUnique({
      where: { id },
    });
    if (!player) {
      throw new NotFoundException(`Jugador con ID ${id} no encontrado`);
    }
    return player;
  }

  // 4. Actualizar un jugador (La función que le faltaba a tu controlador)
  async update(id: string, updatePlayerDto: any) {
    await this.findOne(id);
    return this.prisma.player.update({
      where: { id },
      data: updatePlayerDto,
    });
  }

  // 5. Eliminar un jugador
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.player.delete({
      where: { id },
    });
  }
}
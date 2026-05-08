// apps/backend/src/players/players.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  // REGISTRAR UN JUGADOR
  async create(createPlayerDto: CreatePlayerDto) {
    return this.prisma.player.create({
      data: createPlayerDto,
    });
  }

  // OBTENER TODO EL PLANTEL (ORDENADOS POR NÚMERO DE CAMISETA)
  async findAll() {
    return this.prisma.player.findMany({
      orderBy: {
        jerseyNumber: 'asc',
      },
    });
  }

  // BUSCAR UN JUGADOR POR ID
  async findOne(id: string) {
    const player = await this.prisma.player.findUnique({
      where: { id },
    });
    if (!player) {
      throw new NotFoundException(`El jugador con ID ${id} no existe.`);
    }
    return player;
  }

  // EDITAR DATOS DE UN JUGADOR
  async update(id: string, updatePlayerDto: UpdatePlayerDto) {
    await this.findOne(id); // Valida que exista primero

    return this.prisma.player.update({
      where: { id },
      data: updatePlayerDto,
    });
  }

  // DAR DE BAJA A UN JUGADOR DEL PLANTEL
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.player.delete({
      where: { id },
    });
  }
}
// apps/backend/src/matches/matches.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  // CREAR UN PARTIDO
  async create(createMatchDto: CreateMatchDto) {
    return this.prisma.match.create({
      data: {
        matchDate: new Date(createMatchDto.matchDate),
        homeTeam: createMatchDto.homeTeam,
        awayTeam: createMatchDto.awayTeam,
        stadium: createMatchDto.stadium,
        referee: createMatchDto.referee,
        status: 'scheduled', // Por defecto arranca programado
      },
    });
  }

  // OBTENER TODOS LOS PARTIDOS (ORDENADOS POR FECHA)
  async findAll() {
    return this.prisma.match.findMany({
      orderBy: {
        matchDate: 'asc',
      },
      include: {
        formations: true, // Trae también las formaciones tácticas asociadas
      },
    });
  }

  // OBTENER UN PARTIDO POR ID
  async findOne(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: { formations: true },
    });
    if (!match) {
      throw new NotFoundException(`El partido con ID ${id} no existe.`);
    }
    return match;
  }

  // ACTUALIZAR PARTIDO (Goles, Minuto, Estado en vivo)
  async update(id: string, updateMatchDto: UpdateMatchDto) {
    // Verificar primero si existe
    await this.findOne(id);

    return this.prisma.match.update({
      where: { id },
      data: updateMatchDto,
    });
  }

  // ELIMINAR PARTIDO
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.match.delete({
      where: { id },
    });
  }
}
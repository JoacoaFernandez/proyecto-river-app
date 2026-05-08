// apps/backend/src/formations/formations.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormationDto } from './dto/create-formation.dto';

@Injectable()
export class FormationsService {
  constructor(private prisma: PrismaService) {}

  // ASIGNAR FORMACIÓN A UN PARTIDO
  async create(createFormationDto: CreateFormationDto) {
    const { matchId } = createFormationDto;

    // Validar primero si el partido existe
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException(`El partido con ID ${matchId} no existe.`);
    }

    return this.prisma.formation.create({
      data: createFormationDto,
    });
  }

  // OBTENER TODAS LAS FORMACIONES
  async findAll() {
    return this.prisma.formation.findMany({
      include: {
        match: true, // Trae la info del partido asociado
      },
    });
  }

  // BUSCAR UNA FORMACIÓN POR ID
  async findOne(id: string) {
    const formation = await this.prisma.formation.findUnique({
      where: { id },
      include: { match: true },
    });
    if (!formation) {
      throw new NotFoundException(`La formación con ID ${id} no existe.`);
    }
    return formation;
  }

  // ELIMINAR FORMACIÓN
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.formation.delete({
      where: { id },
    });
  }
}
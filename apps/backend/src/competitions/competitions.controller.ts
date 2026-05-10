// apps/backend/src/competitions/competitions.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CompetitionsService } from './competitions.service';

@ApiTags('Competitions')
@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly service: CompetitionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar competiciones soportadas (Liga, Libertadores, Sudamericana, etc.)' })
  list() {
    return this.service.list();
  }

  @Get(':code/standings')
  @ApiOperation({ summary: 'Obtener tabla de posiciones de una competición' })
  standings(@Param('code') code: string) {
    return this.service.getStandings(code);
  }
}

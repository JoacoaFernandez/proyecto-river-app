// apps/backend/src/matches/matches.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Matches') // Agrupa este controlador bajo 'Matches' en Swagger
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo partido en el fixture' })
  @ApiResponse({ status: 201, description: 'Partido creado con éxito.' })
  create(@Body() createMatchDto: CreateMatchDto) {
    return this.matchesService.create(createMatchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todo el fixture de partidos' })
  findAll() {
    return this.matchesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener los detalles de un partido específico' })
  findOne(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar marcador o estado en vivo de un partido' })
  update(@Param('id') id: string, @Body() updateMatchDto: UpdateMatchDto) {
    return this.matchesService.update(id, updateMatchDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un partido del fixture' })
  remove(@Param('id') id: string) {
    return this.matchesService.remove(id);
  }
}
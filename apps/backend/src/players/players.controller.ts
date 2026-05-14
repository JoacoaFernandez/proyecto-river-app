// apps/backend/src/players/players.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Players')
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Agregar un nuevo jugador al plantel (admin)' })
  @ApiResponse({ status: 201, description: 'Jugador creado exitosamente.' })
  create(@Body() createPlayerDto: CreatePlayerDto) {
    return this.playersService.create(createPlayerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener la lista de todo el plantel de River' })
  findAll() {
    return this.playersService.findAll();
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Ranking de goleadores y asistidores del plantel' })
  getLeaderboard() {
    return this.playersService.getLeaderboard();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener ficha técnica de un jugador específico' })
  findOne(@Param('id') id: string) {
    return this.playersService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Estadísticas de temporada del jugador desde API-Football' })
  getStats(@Param('id') id: string) {
    return this.playersService.getPlayerStats(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar datos de un jugador (editor/admin)' })
  update(@Param('id') id: string, @Body() updatePlayerDto: UpdatePlayerDto) {
    return this.playersService.update(id, updatePlayerDto);
  }

  @Post('sync-injuries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Sincronizar estado de lesiones desde API-Football (admin)' })
  syncInjuries() {
    return this.playersService.syncInjuries();
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar un jugador del plantel (admin)' })
  remove(@Param('id') id: string) {
    return this.playersService.remove(id);
  }
}
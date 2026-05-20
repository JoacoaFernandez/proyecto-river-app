import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MatchesService } from './matches.service';
import { MatchEventsService } from './match-events.service';
import type { CreateMatchEventDto } from './match-events.service';

@ApiTags('Matches')
@Controller('matches')
export class MatchesController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly matchEventsService: MatchEventsService,
  ) {}

  // ── Públicos ────────────────────────────────────────────────────────────────

  @Get('debug')
  async debug() {
    return this.matchesService.getDebugInfo();
  }

  @Get('latest')
  async getLatestMatch() {
    return this.matchesService.getLatestMatch();
  }

  @Get('upcoming')
  async getUpcoming(@Query('limit') limit = '10') {
    const n = parseInt(limit as string, 10) || 10;
    return this.matchesService.getUpcomingMatches(n);
  }

  @Get('past')
  async getPast(@Query('limit') limit = '20') {
    const n = parseInt(limit as string, 10) || 20;
    return this.matchesService.getPastMatches(n);
  }

  @Get('season-progression')
  @ApiOperation({ summary: 'Evolución acumulada de puntos de River por jornada para una temporada' })
  async getSeasonProgression(@Query('year') year?: string) {
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.matchesService.getSeasonProgression(y);
  }

  @Get('seasons-available')
  @ApiOperation({ summary: 'Lista de años con partidos cargados' })
  async getSeasonsAvailable() {
    return this.matchesService.getSeasonsAvailable();
  }

  @Get('h2h')
  @ApiOperation({ summary: 'Historial cara a cara vs un rival' })
  async getH2H(@Query('rival') rival: string, @Query('limit') limit = '6') {
    const n = parseInt(limit as string, 10) || 6;
    return this.matchesService.getH2H(rival, n);
  }

  @Get('by-id/:id')
  @ApiOperation({ summary: 'Obtener partido por ID (público)' })
  async findOnePublic(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }

  @Get('by-id/:id/lineups')
  @ApiOperation({ summary: 'Obtener lineups de ambos equipos para un partido (ESPN, público)' })
  async getLineups(@Param('id') id: string) {
    return this.matchesService.getMatchLineups(id);
  }

  // ── Admin ───────────────────────────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todos los partidos (admin)' })
  async findAll() {
    return this.matchesService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear partido manual (admin)' })
  async create(@Body() body: any) {
    return this.matchesService.createManual(body);
  }

  @Post('import/csv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Importar partidos desde CSV (admin)' })
  async importCsv(@Body() body: { csv: string; dryRun?: boolean }) {
    return this.matchesService.importMatchesCsv(body?.csv ?? '', !!body?.dryRun);
  }

  @Post(':id/resync-events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Re-syncear eventos del partido desde ESPN (admin)' })
  async resyncEvents(@Param('id') id: string) {
    return this.matchesService.resyncMatchEvents(id);
  }

  @Post('events/fix-substitution-swap')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Migración one-shot: corregir orden invertido de sustituciones (admin)' })
  async fixSubSwap() {
    return this.matchesService.fixSubstitutionParticipantsSwap();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener partido por ID (admin)' })
  async findOne(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar partido (admin)' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.matchesService.updateMatch(id, body);
  }

  @Patch(':id/statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar estadísticas de un partido (admin)' })
  async updateStatistics(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.matchesService.updateStatistics(id, body);
  }

  @Patch(':id/photos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar galería de fotos de un partido (admin)' })
  async updatePhotos(@Param('id') id: string, @Body() body: { photos: string[] }) {
    return this.matchesService.updatePhotos(id, body.photos);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar partido (admin)' })
  async remove(@Param('id') id: string) {
    return this.matchesService.removeMatch(id);
  }

  // ── Match Events ────────────────────────────────────────────────────────────

  @Get(':id/events')
  @ApiOperation({ summary: 'Listar eventos de un partido (público)' })
  async getEvents(@Param('id') id: string) {
    return this.matchEventsService.findByMatch(id);
  }

  @Post(':id/events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear evento de partido (admin)' })
  async createEvent(@Param('id') id: string, @Body() body: CreateMatchEventDto) {
    return this.matchEventsService.create(id, body);
  }

  @Patch(':id/events/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Editar evento de partido (admin)' })
  async updateEvent(
    @Param('id') _matchId: string,
    @Param('eventId') eventId: string,
    @Body() body: Partial<CreateMatchEventDto>,
  ) {
    return this.matchEventsService.update(eventId, body);
  }

  @Delete(':id/events/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar evento de partido (admin)' })
  async removeEvent(
    @Param('id') _matchId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.matchEventsService.remove(eventId);
  }
}
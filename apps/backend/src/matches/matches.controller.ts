import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MatchesService } from './matches.service';

@ApiTags('Matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

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

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar partido (admin)' })
  async remove(@Param('id') id: string) {
    return this.matchesService.removeMatch(id);
  }
}
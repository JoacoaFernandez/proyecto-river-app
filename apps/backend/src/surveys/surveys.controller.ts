import { Body, Controller, Delete, Get, Param, Post, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SurveysService } from './surveys.service';

@ApiTags('Surveys')
@Controller('surveys')
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  // ── Público ──────────────────────────────────────────────────────────────────

  @Get('active')
  @ApiOperation({ summary: 'Obtener encuesta activa con resultados' })
  async getActive() {
    const survey = await this.surveysService.findActive();
    if (!survey) return null;
    return this.surveysService.getResults(survey.id);
  }

  @Get(':id/results')
  @ApiOperation({ summary: 'Resultados de una encuesta' })
  async getResults(@Param('id') id: string) {
    return this.surveysService.getResults(id);
  }

  // ── Autenticado ───────────────────────────────────────────────────────────────

  @Get(':id/my-vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Voto del usuario en la encuesta' })
  async getMyVote(@Param('id') id: string, @Request() req: any) {
    return this.surveysService.getUserVote(id, req.user.id);
  }

  @Post(':id/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Votar en una encuesta' })
  async vote(@Param('id') id: string, @Body() body: { optionId: string }, @Request() req: any) {
    return this.surveysService.vote(id, req.user.id, body.optionId);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todas las encuestas (admin)' })
  async findAll() {
    return this.surveysService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear encuesta (admin)' })
  async create(@Body() body: { question: string; options: { id: string; label: string }[] }) {
    return this.surveysService.create(body);
  }

  @Patch(':id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cerrar encuesta (admin)' })
  async close(@Param('id') id: string) {
    return this.surveysService.close(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar encuesta (admin)' })
  async remove(@Param('id') id: string) {
    return this.surveysService.remove(id);
  }
}

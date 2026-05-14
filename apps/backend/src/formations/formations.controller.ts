// apps/backend/src/formations/formations.controller.ts
import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { FormationsService } from './formations.service';
import { CreateFormationDto } from './dto/create-formation.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Formations')
@Controller('formations')
export class FormationsController {
  constructor(private readonly formationsService: FormationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Asignar un esquema táctico a un partido (editor/admin)' })
  @ApiResponse({ status: 201, description: 'Formación creada con éxito.' })
  create(@Body() createFormationDto: CreateFormationDto) {
    return this.formationsService.create(createFormationDto);
  }

  @Get('lineup')
  @ApiOperation({
    summary: 'Obtener el XI titular probable de River sobre la cancha (auto-derivado del plantel)',
  })
  lineup(@Query('scheme') scheme?: string, @Query('refresh') refresh?: string) {
    return this.formationsService.getLineup(scheme, refresh === 'true');
  }

  @Get('history')
  @ApiOperation({ summary: 'Últimos partidos finalizados de River con esquema táctico registrado' })
  getHistory(@Query('limit') limit?: string) {
    return this.formationsService.getHistory(limit ? parseInt(limit, 10) : 12);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las formaciones tácticas registradas' })
  findAll() {
    return this.formationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener los detalles de una formación específica' })
  findOne(@Param('id') id: string) {
    return this.formationsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar una formación (admin)' })
  remove(@Param('id') id: string) {
    return this.formationsService.remove(id);
  }
}
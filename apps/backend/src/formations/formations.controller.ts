// apps/backend/src/formations/formations.controller.ts
import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { FormationsService } from './formations.service';
import { CreateFormationDto } from './dto/create-formation.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Formations') // Agrupa este controlador bajo 'Formations' en Swagger
@Controller('formations')
export class FormationsController {
  constructor(private readonly formationsService: FormationsService) {}

  @Post()
  @ApiOperation({ summary: 'Asignar un esquema táctico a un partido' })
  @ApiResponse({ status: 201, description: 'Formación creada con éxito.' })
  create(@Body() createFormationDto: CreateFormationDto) {
    return this.formationsService.create(createFormationDto);
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
  @ApiOperation({ summary: 'Eliminar una formación' })
  remove(@Param('id') id: string) {
    return this.formationsService.remove(id);
  }
}
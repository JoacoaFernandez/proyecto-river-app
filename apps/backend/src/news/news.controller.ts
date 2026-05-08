// apps/backend/src/news/news.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('News') // Agrupa este controlador bajo 'News' en Swagger
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva noticia (queda en borrador por defecto)' })
  @ApiResponse({ status: 201, description: 'Noticia creada con éxito.' })
  @ApiResponse({ status: 400, description: 'El slug ya existe.' })
  create(@Body() createNewsDto: CreateNewsDto) {
    return this.newsService.create(createNewsDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las noticias publicadas e borradores' })
  findAll() {
    return this.newsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle completo de una noticia' })
  findOne(@Param('id') id: string) {
    return this.newsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar noticia o cambiar su estado (ej: pasar a publicado)' })
  update(@Param('id') id: string, @Body() updateNewsDto: UpdateNewsDto) {
    return this.newsService.update(id, updateNewsDto); // Corregido a newsService
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una noticia' })
  remove(@Param('id') id: string) {
    return this.newsService.remove(id);
  }
}
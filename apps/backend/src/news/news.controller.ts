// apps/backend/src/news/news.controller.ts
import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsAiService } from './news-ai.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly newsAiService: NewsAiService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear una noticia manualmente' })
  create(@Body() createNewsDto: CreateNewsDto) {
    return this.newsService.create(createNewsDto);
  }

  // NUEVO ENDPOINT: http://localhost:3000/news/trigger-ai
  @Post('trigger-ai')
  @ApiOperation({ summary: 'Forzar al robot de Gemini a redactar una noticia real de River ahora mismo' })
  async triggerAiNews() {
    return this.newsAiService.generateAndSaveNews();
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las noticias' })
  findAll() {
    return this.newsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una noticia por ID' })
  findOne(@Param('id') id: string) {
    return this.newsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una noticia' })
  remove(@Param('id') id: string) {
    return this.newsService.remove(id);
  }
}
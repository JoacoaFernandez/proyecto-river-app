// apps/backend/src/news/news.controller.ts
import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsAiService } from './news-ai.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly newsAiService: NewsAiService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear una noticia manualmente (editor/admin)' })
  create(@Body() createNewsDto: CreateNewsDto) {
    return this.newsService.create(createNewsDto);
  }

  @Post('trigger-ai')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Forzar al redactor con IA a generar una noticia ahora (admin)' })
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar una noticia (admin)' })
  remove(@Param('id') id: string) {
    return this.newsService.remove(id);
  }
}
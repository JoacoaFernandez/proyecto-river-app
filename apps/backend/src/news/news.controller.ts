// apps/backend/src/news/news.controller.ts
import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Patch } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsAiService } from './news-ai.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly newsAiService: NewsAiService,
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

  @Get('reported-comments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener comentarios reportados (admin)' })
  getReportedComments() {
    return this.newsService.getReportedComments();
  }

  @Get('admin/all-comments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Todos los comentarios para moderación (admin)' })
  getAllCommentsAdmin() {
    return this.newsService.getAllCommentsAdmin();
  }

  @Patch('comments/:id/hide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  hideComment(@Param('id') id: string) {
    return this.newsService.hideComment(id);
  }

  @Patch('comments/:id/unhide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  unhideComment(@Param('id') id: string) {
    return this.newsService.unhideComment(id);
  }

  @Patch('comments/:id/dismiss')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  dismissReport(@Param('id') id: string) {
    return this.newsService.dismissReport(id);
  }

  @Patch('users/:userId/ban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  banUser(@Param('userId') userId: string) {
    return this.newsService.banUser(userId);
  }

  @Patch('users/:userId/unban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  unbanUser(@Param('userId') userId: string) {
    return this.newsService.unbanUser(userId);
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

  @Get(':id/related')
  @ApiOperation({ summary: 'Obtener artículos relacionados por categoría' })
  async getRelated(@Param('id') id: string) {
    const news = await this.newsService.findOne(id);
    return this.newsService.getRelated(id, news.category);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Editar una noticia (editor/admin)' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.newsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar una noticia (admin)' })
  remove(@Param('id') id: string) {
    return this.newsService.remove(id);
  }

  // ── COMENTARIOS ────────────────────────────────────────────────────────────

  @Get(':id/comments')
  @ApiOperation({ summary: 'Obtener comentarios de una noticia (con replies y like count)' })
  getComments(@Param('id') id: string) {
    return this.newsService.getComments(id);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Agregar un comentario a una noticia (soporta parentId para replies)' })
  addComment(
    @Param('id') id: string,
    @Body() body: { body: string; parentId?: string },
    @Request() req: any,
  ) {
    return this.newsService.addComment(id, req.user.id, body.body, body.parentId);
  }

  @Delete(':id/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar un comentario' })
  removeComment(@Param('commentId') commentId: string, @Request() req: any) {
    return this.newsService.removeComment(commentId, req.user.id, req.user.role);
  }

  @Post(':id/comments/:commentId/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reportar un comentario como inapropiado' })
  reportComment(@Param('commentId') commentId: string) {
    return this.newsService.reportComment(commentId);
  }

  @Post(':id/comments/:commentId/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle like en un comentario' })
  toggleCommentLike(@Param('commentId') commentId: string, @Request() req: any) {
    return this.newsService.toggleCommentLike(commentId, req.user.id);
  }

  // ── LIKES ──────────────────────────────────────────────────────────────────

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle like en una noticia' })
  toggleLike(@Param('id') id: string, @Request() req: any) {
    return this.newsService.toggleLike(id, req.user.id);
  }

  @Get(':id/likes')
  @UseGuards(OptionalJwtGuard)
  @ApiOperation({ summary: 'Obtener conteo de likes de una noticia' })
  getLikes(@Param('id') id: string, @Request() req: any) {
    return this.newsService.getLikeStatus(id, req.user?.id ?? null);
  }
}

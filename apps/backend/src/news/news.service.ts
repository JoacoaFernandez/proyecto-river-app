// apps/backend/src/news/news.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  // Generador automático de slugs limpios para los portales de origen
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // CREACIÓN AUTÓNOMA DE NOTICIAS
  async create(createNewsDto: CreateNewsDto) {
    // 1. Buscamos de forma transparente al usuario "Periodista IA" para cumplir la relación obligatoria (fkey)
    let author = await this.prisma.user.findFirst({
      where: { email: 'periodista.ia@riverapp.com' },
    });

    // 2. Si no existe en tu base de Render (por ejemplo, base de datos limpia), lo creamos con tus columnas reales
    if (!author) {
      author = await this.prisma.user.create({
        data: {
          email: 'periodista.ia@riverapp.com',
          password_hash: '$2b$10$PlaceholderHashForIASystemAccountOnly', // Tu columna obligatoria real
          display_name: 'Periodista Millonario IA',                 // Tu columna obligatoria real
          role: 'ADMIN',
        },
      });
    }

    // 3. Generamos el slug automático para que no lo tengas que definir vos
    const slug = createNewsDto.slug || this.generateSlug(createNewsDto.title);

    // 4. Evitamos duplicar noticias que ya hayamos extraído de las plataformas de origen
    const slugExists = await this.prisma.news.findUnique({ where: { slug } });
    if (slugExists) {
      throw new BadRequestException('El slug de la noticia ya está en uso. Elige uno diferente.');
    }

    // 5. Guardamos en Render enlazando el ID del autor de forma transparente
    return this.prisma.news.create({
      data: {
        title: createNewsDto.title,
        body: createNewsDto.body,
        category: createNewsDto.category || 'Actualidad',
        status: createNewsDto.status || 'published',
        slug,
        imageUrl: createNewsDto.imageUrl || null,
        authorId: createNewsDto.authorId || author.id,
      },
    });
  }

  // OBTENER TODAS LAS NOTICIAS (Las más nuevas primero)
  async findAll() {
    return this.prisma.news.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  // BUSCAR NOTICIA POR ID
  async findOne(id: string) {
    const news = await this.prisma.news.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            display_name: true,
          },
        },
      },
    });
    if (!news) {
      throw new NotFoundException(`La noticia con ID ${id} no existe.`);
    }
    return news;
  }

  // EDITAR NOTICIA
  async update(id: string, updateNewsDto: UpdateNewsDto) {
    await this.findOne(id);

    const dataToUpdate: any = { ...updateNewsDto };
    
    if (updateNewsDto.status === 'published') {
      dataToUpdate.publishedAt = new Date();
    }

    return this.prisma.news.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  // ELIMINAR NOTICIA
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.news.delete({
      where: { id },
    });
  }

  // ── COMENTARIOS ──────────────────────────────────────────────────────────────

  async getComments(newsId: string) {
    await this.findOne(newsId);
    return this.prisma.comment.findMany({
      where: { newsId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, display_name: true, avatar_url: true } },
      },
    });
  }

  async addComment(newsId: string, userId: string, body: string) {
    await this.findOne(newsId);
    return this.prisma.comment.create({
      data: { newsId, userId, body },
      include: {
        user: { select: { id: true, display_name: true, avatar_url: true } },
      },
    });
  }

  async removeComment(commentId: string, userId: string, userRole: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comentario no encontrado.');
    if (comment.userId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('No podés eliminar este comentario.');
    }
    return this.prisma.comment.delete({ where: { id: commentId } });
  }

  // ── LIKES ─────────────────────────────────────────────────────────────────────

  async toggleLike(newsId: string, userId: string) {
    await this.findOne(newsId);
    const existing = await this.prisma.newsLike.findUnique({
      where: { newsId_userId: { newsId, userId } },
    });
    if (existing) {
      await this.prisma.newsLike.delete({ where: { newsId_userId: { newsId, userId } } });
    } else {
      await this.prisma.newsLike.create({ data: { newsId, userId } });
    }
    const count = await this.prisma.newsLike.count({ where: { newsId } });
    return { liked: !existing, count };
  }

  async getLikeStatus(newsId: string, userId: string | null) {
    const count = await this.prisma.newsLike.count({ where: { newsId } });
    const liked = userId
      ? !!(await this.prisma.newsLike.findUnique({ where: { newsId_userId: { newsId, userId } } }))
      : false;
    return { liked, count };
  }
}
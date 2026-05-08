// apps/backend/src/news/news.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  // CREAR NOTICIA
  async create(createNewsDto: CreateNewsDto) {
    const { slug } = createNewsDto;

    // Verificar si el slug ya existe (debe ser único)
    const slugExists = await this.prisma.news.findUnique({ where: { slug } });
    if (slugExists) {
      throw new BadRequestException('El slug de la noticia ya está en uso. Elige uno diferente.');
    }

    return this.prisma.news.create({
      data: createNewsDto,
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

  // EDITAR NOTICIA (O Publicarla cambiando status a 'published')
  async update(id: string, updateNewsDto: UpdateNewsDto) {
    await this.findOne(id); // Validar existencia

    const dataToUpdate: any = { ...updateNewsDto };
    
    // Si se pasa a estado 'published', guardamos la fecha de publicación actual
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
}
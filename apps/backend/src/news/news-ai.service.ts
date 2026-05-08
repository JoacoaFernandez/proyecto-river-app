// apps/backend/src/news/news-ai.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import Parser from 'rss-parser';

@Injectable()
export class NewsAiService implements OnModuleInit {
  private readonly logger = new Logger(NewsAiService.name);
  private readonly parser: Parser;

  constructor(private readonly prisma: PrismaService) {
    this.parser = new Parser();
  }

  async onModuleInit() {
    this.logger.log('⚡ [Autónomo] Servidor encendido. Iniciando scraper múltiple con enlaces...');
    setTimeout(async () => {
      await this.generateAndSaveNews();
    }, 5000);
  }

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

  @Cron(CronExpression.EVERY_8_HOURS)
  async handleCron() {
    this.logger.log('📰 [CRON] Sincronizando noticias y enlaces originales...');
    await this.generateAndSaveNews();
  }

  async generateAndSaveNews() {
    try {
      let author = await this.prisma.user.findFirst({
        where: { email: 'periodista.ia@riverapp.com' },
      });

      if (!author) {
        author = await this.prisma.user.create({
          data: {
            email: 'periodista.ia@riverapp.com',
            password_hash: '$2b$10$PlaceholderHashForSystemAccountOnly',
            display_name: 'Prensa Millonaria',
            role: 'ADMIN',
          },
        });
      }

      this.logger.log('📡 Conectando con Diario Olé para importar noticias y URLs...');
      const feed = await this.parser.parseURL('https://www.ole.com.ar/rss/river-plate/');

      if (!feed.items || feed.items.length === 0) {
        this.logger.log('🤫 El feed de Olé no tiene artículos disponibles.');
        return;
      }

      let nuevasImportadas = 0;

      for (const item of feed.items) {
        const title = item.title || '';
        const rawBody = item.contentSnippet || item.content || '';
        const body = rawBody.replace(/<[^>]*>/g, '').trim();
        const articleUrl = item.link || null; // 👈 CAPTURAMOS EL LINK ORIGINAL DEL FEED
        
        if (!title || !body) continue;

        const generatedSlug = this.generateSlug(title);

        const exists = await this.prisma.news.findUnique({
          where: { slug: generatedSlug },
        });

        // Si ya existe pero por alguna razón no tenía URL, se la actualizamos
        if (exists) {
          if (!exists.url && articleUrl) {
            await this.prisma.news.update({
              where: { id: exists.id },
              data: { url: articleUrl }
            });
          }
          continue;
        }

        // Guardamos la noticia incluyendo la URL original de Olé
        await this.prisma.news.create({
          data: {
            title,
            body,
            category: 'Actualidad',
            slug: generatedSlug,
            url: articleUrl, // 👈 GUARDAMOS LA URL EN BASE DE DATOS
            authorId: author.id,
            status: 'published',
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          },
        });

        nuevasImportadas++;
        this.logger.log(`📥 Importada con éxito: "${title}" -> Link: ${articleUrl}`);
      }

      if (nuevasImportadas > 0) {
        this.logger.log(`🎉 [ÉXITO] Se han sincronizado ${nuevasImportadas} noticias con sus respectivos enlaces.`);
      } else {
        this.logger.log('✅ Base de datos al día con links originales.');
      }

    } catch (error: any) {
      this.logger.error(`❌ Error en el importador de noticias con links: ${error.message}`);
    }
  }
}
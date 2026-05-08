// apps/backend/src/news/news.module.ts
import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { NewsAiService } from './news-ai.service'; // Importamos el nuevo servicio de IA
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NewsController],
  providers: [NewsService, NewsAiService], // Registramos ambos servicios en el backend
  exports: [NewsService, NewsAiService],
})
export class NewsModule {}
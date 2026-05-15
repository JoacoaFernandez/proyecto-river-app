// apps/backend/src/news/news.module.ts
import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { NewsAiService } from './news-ai.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [PrismaModule, PushModule],
  controllers: [NewsController],
  providers: [NewsService, NewsAiService],
  exports: [NewsService, NewsAiService],
})
export class NewsModule {}
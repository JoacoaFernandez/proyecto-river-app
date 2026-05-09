import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { MatchesModule } from './matches/matches.module';
import { NewsModule } from './news/news.module';
import { PlayersModule } from './players/players.module';
import { LiveApiModule } from './live-api.module';

@Module({
  imports: [
    PrismaModule,
    MatchesModule,
    NewsModule,
    PlayersModule,
    LiveApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
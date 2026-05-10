import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MatchesModule } from './matches/matches.module';
import { NewsModule } from './news/news.module';
import { PlayersModule } from './players/players.module';
import { FormationsModule } from './formations/formations.module';
import { LiveApiModule } from './live-api.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    MatchesModule,
    NewsModule,
    PlayersModule,
    FormationsModule,
    LiveApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
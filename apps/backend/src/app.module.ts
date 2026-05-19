import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MatchesModule } from './matches/matches.module';
import { NewsModule } from './news/news.module';
import { PlayersModule } from './players/players.module';
import { FormationsModule } from './formations/formations.module';
import { CompetitionsModule } from './competitions/competitions.module';
import { LiveApiModule } from './live-api.module';
import { PredictionsModule } from './predictions/predictions.module';
import { AiModule } from './ai/ai.module';
import { PushModule } from './push/push.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SurveysModule } from './surveys/surveys.module';
import { FavoritesModule } from './favorites/favorites.module';
import { RatingsModule } from './ratings/ratings.module';
import { MetricsModule } from './metrics/metrics.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

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
    CompetitionsModule,
    LiveApiModule,
    PredictionsModule,
    AiModule,
    PushModule,
    NotificationsModule,
    SurveysModule,
    FavoritesModule,
    RatingsModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

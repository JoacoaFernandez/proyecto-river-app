// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MatchesModule } from './matches/matches.module';
import { PlayersModule } from './players/players.module';
import { NewsModule } from './news/news.module';
import { FormationsModule } from './formations/formations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Carga las variables de tu .env
    PrismaModule, // Conexión global a la base de datos de Render
    AuthModule,
    MatchesModule,
    PlayersModule,
    NewsModule,
    FormationsModule,
  ],
})
export class AppModule {}
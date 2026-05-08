import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { MatchesModule } from './matches/matches.module';
import { NewsModule } from './news/news.module';       // 👈 ¡Faltaba esto!
import { PlayersModule } from './players/players.module'; // 👈 ¡Faltaba esto! (O SquadModule, según cómo lo llamaste)

@Module({
  imports: [
    PrismaModule,
    MatchesModule,
    NewsModule,     // 👈 ¡Enchufamos las noticias!
    PlayersModule,  // 👈 ¡Enchufamos el plantel!
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
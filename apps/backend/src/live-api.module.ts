import { Module } from '@nestjs/common';
import { LiveApiController } from './live-api.controller';
import { LiveApiService } from './live-api.service';
import { LiveApiGateway } from './live-api.gateway';
import { MatchesModule } from './matches/matches.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { PlayersModule } from './players/players.module';

@Module({
  imports: [MatchesModule, AuthModule, PrismaModule, PlayersModule],
  controllers: [LiveApiController],
  providers: [LiveApiService, LiveApiGateway],
  exports: [LiveApiService],
})
export class LiveApiModule {}

import { Module } from '@nestjs/common';
import { LiveApiController } from './live-api.controller';
import { LiveApiService } from './live-api.service';
import { LiveApiGateway } from './live-api.gateway';
import { MatchesModule } from './matches/matches.module';

@Module({
  imports: [MatchesModule],
  controllers: [LiveApiController],
  providers: [LiveApiService, LiveApiGateway],
})
export class LiveApiModule {}

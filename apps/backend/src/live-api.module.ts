import { Module } from '@nestjs/common';
import { LiveApiController } from './live-api.controller';
import { LiveApiService } from './live-api.service';
import { MatchesModule } from './matches/matches.module';

@Module({
  imports: [MatchesModule],
  controllers: [LiveApiController],
  providers: [LiveApiService],
})
export class LiveApiModule {}

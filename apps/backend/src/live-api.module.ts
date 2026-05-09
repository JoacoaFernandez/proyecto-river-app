import { Module } from '@nestjs/common';
import { LiveApiController } from './live-api.controller';
import { LiveApiService } from './live-api.service';

@Module({
  controllers: [LiveApiController],
  providers: [LiveApiService],
})
export class LiveApiModule {}
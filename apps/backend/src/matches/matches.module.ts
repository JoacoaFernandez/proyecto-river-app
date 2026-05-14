import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchEventsService } from './match-events.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PredictionsModule } from '../predictions/predictions.module';

@Module({
  imports: [PrismaModule, PredictionsModule],
  controllers: [MatchesController],
  providers: [MatchesService, MatchEventsService],
  exports: [MatchesService, MatchEventsService],
})
export class MatchesModule {}

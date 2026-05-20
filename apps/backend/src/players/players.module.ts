import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}

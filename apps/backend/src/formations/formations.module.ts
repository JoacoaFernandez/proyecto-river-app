import { Module } from '@nestjs/common';
import { FormationsController } from './formations.controller';
import { FormationsService } from './formations.service';

@Module({
  controllers: [FormationsController],
  providers: [FormationsService]
})
export class FormationsModule {}

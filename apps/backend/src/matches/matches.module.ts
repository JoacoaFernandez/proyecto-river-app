// apps/backend/src/matches/matches.module.ts
import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { SyncService } from './sync.service'; // Importamos el robot de sincronización
import { HttpModule } from '@nestjs/axios';    // Importamos el módulo HTTP de NestJS

@Module({
  imports: [HttpModule], // Habilita Axios para hacer consultas a la API externa
  controllers: [MatchesController],
  providers: [MatchesService, SyncService], // Registramos ambos servicios
  exports: [MatchesService],
})
export class MatchesModule {}
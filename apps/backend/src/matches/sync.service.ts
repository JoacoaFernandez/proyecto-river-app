// apps/backend/src/matches/sync.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE) // Revisa la API de forma autónoma cada 1 minuto
  async syncLiveMatch() {
    this.logger.log('Iniciando sincronización automática con API-Football...');

    const apiKey = process.env.API_FOOTBALL_KEY;
    const teamId = process.env.RIVER_PLATE_TEAM_ID || '268';

    if (!apiKey) {
      this.logger.warn('No se encontró la API_FOOTBALL_KEY en las variables de entorno.');
      return;
    }

    try {
      // 1. Preguntarle a API-Football si River está jugando en vivo
      const response = await firstValueFrom(
        this.httpService.get(`https://v3.football.api-sports.io/fixtures?team=${teamId}&live=all`, {
          headers: { 'x-apisports-key': apiKey },
        })
      );

      const fixtures = response.data.response;

      if (!fixtures || fixtures.length === 0) {
        this.logger.log('River Plate no está jugando ningún partido en vivo en este momento.');
        return;
      }

      const liveFixture = fixtures[0];
      const homeTeamName = liveFixture.teams.home.name;
      const awayTeamName = liveFixture.teams.away.name;
      const homeGoals = liveFixture.goals.home ?? 0;
      const awayGoals = liveFixture.goals.away ?? 0;
      const elapsedMinute = liveFixture.fixture.status.elapsed ?? 0;
      const matchStatus = liveFixture.fixture.status.short; // '1H', '2H', 'HT', 'FT'

      this.logger.log(`¡Partido en vivo detectado! ${homeTeamName} ${homeGoals} - ${awayGoals} ${awayTeamName} (Minuto ${elapsedMinute})`);

      // 2. Buscar si tenemos registrado este partido en la BD de Render
      const dbMatch = await this.prisma.match.findFirst({
        where: {
          OR: [
            { homeTeam: homeTeamName, status: 'live' },
            { homeTeam: homeTeamName, status: 'scheduled' },
            { awayTeam: awayTeamName, status: 'live' },
            { awayTeam: awayTeamName, status: 'scheduled' }
          ]
        },
      });

      if (!dbMatch) {
        this.logger.warn('El partido en vivo no está registrado en nuestra base de datos. Se omite.');
        return;
      }

      let newStatus = 'live';
      if (matchStatus === 'FT') {
        newStatus = 'finished';
      }

      // 3. Impactar los datos en vivo en tu PostgreSQL de Render
      await this.prisma.match.update({
        where: { id: dbMatch.id },
        data: {
          homeScore: homeGoals,
          awayScore: awayGoals,
          minute: elapsedMinute,
          status: newStatus,
        },
      });

      this.logger.log(`Base de datos de Render sincronizada para el partido: ${dbMatch.id}`);

      // Resolver predicciones si el partido acaba de terminar
      if (newStatus === 'finished' && dbMatch.status !== 'finished') {
        await this.resolvePredictions(dbMatch.id, homeGoals, awayGoals);
      }

    } catch (error) {
      this.logger.error('Error al sincronizar con API-Football:', error.message);
    }
  }

  private async resolvePredictions(matchId: string, homeGoals: number, awayGoals: number) {
    this.logger.log(`Resolviendo predicciones para el partido ${matchId}...`);
    
    let result: 'home' | 'draw' | 'away' = 'draw';
    if (homeGoals > awayGoals) result = 'home';
    else if (awayGoals > homeGoals) result = 'away';

    const pendingPredictions = await this.prisma.prediction.findMany({
      where: { matchId, status: 'pending' },
    });

    for (const pred of pendingPredictions) {
      const isWinner = pred.choice === result;
      const newStatus = isWinner ? 'won' : 'lost';
      
      await this.prisma.prediction.update({
        where: { id: pred.id },
        data: { status: newStatus },
      });

      if (isWinner) {
        await this.prisma.user.update({
          where: { id: pred.userId },
          data: { points: { increment: 10 } }, // Asigna 10 puntos por acierto
        });
      }
    }

    this.logger.log(`Predicciones resueltas: ${pendingPredictions.length} procesadas.`);
  }
}
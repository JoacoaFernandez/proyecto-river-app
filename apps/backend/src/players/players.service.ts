// apps/backend/src/players/players.service.ts
import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';

const API_HEADERS = () => ({
  'x-rapidapi-key': process.env.API_FOOTBALL_KEY ?? '',
  'x-rapidapi-host': 'v3.football.api-sports.io',
});
const RIVER_TEAM_IDS = [268, 435];

@Injectable()
export class PlayersService implements OnModuleInit {
  private readonly logger = new Logger(PlayersService.name);
  private readonly statsCache = new Map<string, { data: PlayerStatsDto | null; ts: number }>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Sync injuries on startup without blocking boot
    this.syncInjuries().catch((e) =>
      this.logger.warn('Injury sync on startup failed: ' + e.message),
    );
  }

  // 1. Guardar un jugador de forma segura en Render
  async create(createPlayerDto: CreatePlayerDto) {
    return this.prisma.player.create({
      data: createPlayerDto,
    });
  }

  // 2. Traer todos los jugadores ordenados por su número de camiseta real
  async findAll() {
    return this.prisma.player.findMany({
      orderBy: {
        number: 'asc', // Corregido 'jerseyNumber'
      },
    });
  }

  // 3. Traer un solo jugador
  async findOne(id: string) {
    const player = await this.prisma.player.findUnique({
      where: { id },
    });
    if (!player) {
      throw new NotFoundException(`Jugador con ID ${id} no encontrado`);
    }
    return player;
  }

  // 4. Actualizar un jugador (La función que le faltaba a tu controlador)
  async update(id: string, updatePlayerDto: any) {
    await this.findOne(id);
    return this.prisma.player.update({
      where: { id },
      data: updatePlayerDto,
    });
  }

  // 5. Eliminar un jugador
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.player.delete({
      where: { id },
    });
  }

  // 6. Leaderboard de goleadores (caché 1 hora)
  private leaderboardCache: { data: LeaderboardEntry[]; ts: number } | null = null;

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (this.leaderboardCache && Date.now() - this.leaderboardCache.ts < 3_600_000) {
      return this.leaderboardCache.data;
    }

    const players = await this.prisma.player.findMany({ orderBy: { number: 'asc' } });
    const settled = await Promise.allSettled(
      players.map(async (p) => {
        const stats = await this.getPlayerStats(p.id);
        if (!stats) return null;
        return {
          id: p.id,
          name: p.name,
          position: p.position,
          number: p.number,
          photo: p.photo,
          goals: stats.goals,
          assists: stats.assists,
          appearances: stats.appearances,
          season: stats.season,
        } as LeaderboardEntry;
      }),
    );

    const data = (settled as PromiseFulfilledResult<LeaderboardEntry | null>[])
      .filter((r) => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value as LeaderboardEntry)
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists);

    this.leaderboardCache = { data, ts: Date.now() };
    return data;
  }

  // 7. Sincronizar estado de lesiones desde API-Football (diario + startup)
  @Cron('0 8 * * *')
  async syncInjuries(): Promise<{ synced: number; injured: number }> {
    if (!process.env.API_FOOTBALL_KEY) return { synced: 0, injured: 0 };

    const season = 2025;
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Collect most-recent injury report per player API ID within last 30 days
    const injuryMap = new Map<string, { type: string; zone: string; fixtureDate: Date }>();

    for (const teamId of RIVER_TEAM_IDS) {
      try {
        const res = await axios.get('https://v3.football.api-sports.io/injuries', {
          params: { team: teamId, season },
          headers: API_HEADERS(),
          timeout: 15000,
        });

        for (const entry of res.data?.response ?? []) {
          const fixtureDate = entry.fixture?.date ? new Date(entry.fixture.date) : null;
          if (!fixtureDate || fixtureDate < cutoff) continue;

          const apiId = String(entry.player?.id ?? '');
          if (!apiId) continue;

          const existing = injuryMap.get(apiId);
          if (!existing || fixtureDate > existing.fixtureDate) {
            injuryMap.set(apiId, {
              type: entry.type ?? 'Lesión',
              zone: entry.reason ?? '',
              fixtureDate,
            });
          }
        }
      } catch (e: any) {
        this.logger.warn(`Injury fetch failed for team ${teamId}: ${e.message}`);
      }
    }

    const players = await this.prisma.player.findMany();
    let injured = 0;

    for (const player of players) {
      // Extract API Football player ID from photo URL
      const apiId = player.photo?.split('/').pop()?.replace('.png', '') ?? '';
      const details = injuryMap.get(apiId);

      if (details) {
        await this.prisma.player.update({
          where: { id: player.id },
          data: {
            status: 'injured',
            injuryType: details.type,
            injuryZone: details.zone || null,
          },
        });
        injured++;
      } else if (player.status === 'injured') {
        // No recent injury → mark as available again
        await this.prisma.player.update({
          where: { id: player.id },
          data: { status: 'available', injuryType: null, injuryZone: null, injuryReturnDate: null },
        });
      }
    }

    this.logger.log(`Injuries synced: ${injured} lesionados de ${players.length} jugadores`);
    return { synced: players.length, injured };
  }

  // 8. Estadísticas desde API-Football (caché 10 min por jugador)
  async getPlayerStats(id: string): Promise<PlayerStatsDto | null> {
    const cached = this.statsCache.get(id);
    if (cached && Date.now() - cached.ts < 600_000) return cached.data;

    const player = await this.findOne(id);

    // La URL de la foto tiene el ID del jugador en API-Football:
    // https://media.api-sports.io/football/players/12345.png
    const apiId = player.photo
      ? player.photo.split('/').pop()?.replace('.png', '')
      : null;

    if (!apiId || !process.env.API_FOOTBALL_KEY) {
      this.statsCache.set(id, { data: null, ts: Date.now() });
      return null;
    }

    const headers = {
      'x-rapidapi-key': process.env.API_FOOTBALL_KEY,
      'x-rapidapi-host': 'v3.football.api-sports.io',
    };

    // Intenta la temporada actual primero, luego la anterior
    for (const season of [2025, 2024]) {
      try {
        const res = await axios.get('https://v3.football.api-sports.io/players', {
          params: { id: apiId, season },
          headers,
          timeout: 10000,
        });

        const entry = res.data?.response?.[0];
        if (!entry) continue;

        const p = entry.player ?? {};
        const st = entry.statistics?.[0] ?? {};

        const result: PlayerStatsDto = {
          height: p.height ?? null,
          weight: p.weight ?? null,
          birthDate: p.birth?.date ?? null,
          birthPlace: p.birth?.place ?? null,
          birthCountry: p.birth?.country ?? null,
          appearances: st.games?.appearences ?? 0,
          lineups: st.games?.lineups ?? 0,
          minutes: st.games?.minutes ?? 0,
          rating: st.games?.rating ? parseFloat(st.games.rating).toFixed(1) : null,
          goals: st.goals?.total ?? 0,
          penaltyGoals: st.penalty?.scored ?? 0,
          assists: st.goals?.assists ?? 0,
          yellowCards: st.cards?.yellow ?? 0,
          redCards: st.cards?.red ?? 0,
          season,
        };

        this.statsCache.set(id, { data: result, ts: Date.now() });
        return result;
      } catch (e: any) {
        this.logger.warn(`API-Football stats falló (jugador ${apiId}, temporada ${season}): ${e?.message}`);
      }
    }

    this.statsCache.set(id, { data: null, ts: Date.now() });
    return null;
  }
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  position: string;
  number: number | null;
  photo: string | null;
  goals: number;
  assists: number;
  appearances: number;
  season: number;
}

export interface PlayerStatsDto {
  height: string | null;
  weight: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  birthCountry: string | null;
  appearances: number;
  lineups: number;
  minutes: number;
  rating: string | null;
  goals: number;
  penaltyGoals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  season: number;
}
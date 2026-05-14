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
    // No auto-sync: injuries endpoint requires premium API-Football plan
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

    // Use ESPN roster (one cached request) instead of N individual API-Football calls
    const [players, espnRoster] = await Promise.all([
      this.prisma.player.findMany({ orderBy: { number: 'asc' } }),
      this.fetchEspnRoster(),
    ]);

    const data: LeaderboardEntry[] = players
      .map((p) => {
        const espn = p.number != null ? espnRoster.get(p.number) : null;
        return {
          id: p.id,
          name: p.name,
          position: p.position,
          number: p.number,
          photo: p.photo,
          goals: espn?.goals ?? 0,
          assists: espn?.assists ?? 0,
          appearances: espn?.appearances ?? 0,
          season: 2026,
        } as LeaderboardEntry;
      })
      .filter((e) => e.appearances > 0 || e.goals > 0)
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists);

    this.leaderboardCache = { data, ts: Date.now() };
    return data;
  }

  // 7. Debug: devuelve la respuesta cruda de /injuries para inspección
  async getInjuriesRaw(): Promise<any> {
    const results: any = {};
    for (const season of [2025, 2024]) {
      for (const teamId of RIVER_TEAM_IDS) {
        try {
          const res = await axios.get('https://v3.football.api-sports.io/injuries', {
            params: { team: teamId, season },
            headers: API_HEADERS(),
            timeout: 15000,
          });
          results[`team${teamId}_season${season}`] = {
            total: res.data?.results,
            sample: (res.data?.response ?? []).slice(0, 3),
          };
        } catch (e: any) {
          results[`team${teamId}_season${season}`] = { error: e.message };
        }
      }
    }
    return results;
  }

  // 8. Sincronizar estado de lesiones desde API-Football (diario + startup)
  @Cron('0 8 * * *')
  async syncInjuries(): Promise<{ synced: number; injured: number; raw?: any }> {
    if (!process.env.API_FOOTBALL_KEY) return { synced: 0, injured: 0 };

    // Per player: keep track of most recent injury entry across all seasons/teams
    const injuryMap = new Map<string, { type: string; zone: string; fixtureDate: Date }>();

    for (const season of [2025, 2024]) {
      for (const teamId of RIVER_TEAM_IDS) {
        try {
          const res = await axios.get('https://v3.football.api-sports.io/injuries', {
            params: { team: teamId, season },
            headers: API_HEADERS(),
            timeout: 15000,
          });

          this.logger.log(
            `Injuries API team=${teamId} season=${season}: ${res.data?.results ?? 0} entries`,
          );

          for (const entry of res.data?.response ?? []) {
            const fixtureDate = entry.fixture?.date ? new Date(entry.fixture.date) : null;
            if (!fixtureDate) continue;

            // API-Football puts type/reason inside entry.player, not at root
            const apiId = String(entry.player?.id ?? '');
            if (!apiId) continue;

            const existing = injuryMap.get(apiId);
            if (!existing || fixtureDate > existing.fixtureDate) {
              injuryMap.set(apiId, {
                type: entry.player?.type ?? 'Lesión',
                zone: entry.player?.reason ?? '',
                fixtureDate,
              });
            }
          }
        } catch (e: any) {
          this.logger.warn(`Injury fetch failed for team ${teamId} season ${season}: ${e.message}`);
        }
      }
    }

    // Only consider players whose most recent injury fixture is within 90 days
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const recentlyInjuredIds = new Set(
      [...injuryMap.entries()]
        .filter(([, v]) => v.fixtureDate >= cutoff)
        .map(([id]) => id),
    );

    this.logger.log(
      `Found ${injuryMap.size} total injury records, ${recentlyInjuredIds.size} within last 90 days`,
    );

    const players = await this.prisma.player.findMany();
    let injured = 0;

    for (const player of players) {
      // Extract API Football player ID from photo URL (e.g. .../players/12345.png → "12345")
      const apiId = player.photo?.split('/').pop()?.replace('.png', '') ?? '';
      const details = injuryMap.get(apiId);
      const isRecentlyInjured = recentlyInjuredIds.has(apiId);

      if (isRecentlyInjured && details) {
        await this.prisma.player.update({
          where: { id: player.id },
          data: {
            status: 'injured',
            injuryType: details.type,
            injuryZone: details.zone || null,
          },
        });
        this.logger.log(`  → Lesionado: ${player.name} (${details.type})`);
        injured++;
      } else if (player.status === 'injured') {
        // Had old injury but no recent fixture confirms it → reset to available
        await this.prisma.player.update({
          where: { id: player.id },
          data: { status: 'available', injuryType: null, injuryZone: null, injuryReturnDate: null },
        });
      }
    }

    this.logger.log(`Injuries synced: ${injured} lesionados de ${players.length} jugadores`);
    return { synced: players.length, injured };
  }

  // Competiciones ESPN a agregar para stats de temporada completa
  private static readonly ESPN_LEAGUES = [
    'arg.1',                   // Liga Profesional
    'conmebol.libertadores',   // Copa Libertadores
    'conmebol.sudamericana',   // Copa Sudamericana (por si aplica)
  ];

  // ESPN roster cache: jersey → stats acumuladas de todas las competencias
  private espnRosterCache: { data: Map<number, EspnStats>; ts: number } | null = null;

  private async fetchEspnRoster(): Promise<Map<number, EspnStats>> {
    if (this.espnRosterCache && Date.now() - this.espnRosterCache.ts < 6 * 3_600_000) {
      return this.espnRosterCache.data;
    }
    const map = new Map<number, EspnStats>();

    for (const league of PlayersService.ESPN_LEAGUES) {
      try {
        const res = await axios.get(
          `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/16/roster`,
          { timeout: 15000 },
        );
        for (const athlete of res.data?.athletes ?? []) {
          const jersey = parseInt(athlete.jersey ?? '');
          if (isNaN(jersey)) continue;

          if (!map.has(jersey)) {
            map.set(jersey, { fullName: athlete.fullName ?? '', appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, saves: 0 });
          }
          const entry = map.get(jersey)!;

          for (const cat of athlete.statistics?.splits?.categories ?? []) {
            for (const s of cat.stats ?? []) {
              const v: number = s.value ?? 0;
              switch (s.name) {
                case 'appearances': entry.appearances += v; break;
                case 'totalGoals':  entry.goals += v; break;
                case 'goalAssists': entry.assists += v; break;
                case 'yellowCards': entry.yellowCards += v; break;
                case 'redCards':    entry.redCards += v; break;
                case 'saves':       entry.saves += v; break;
              }
            }
          }
        }
        this.logger.log(`ESPN ${league}: ${res.data?.athletes?.length ?? 0} jugadores`);
      } catch (e: any) {
        this.logger.warn(`ESPN roster falló para ${league}: ${e.message}`);
      }
    }

    this.logger.log(`ESPN total acumulado: ${map.size} jugadores con stats`);
    this.espnRosterCache = { data: map, ts: Date.now() };
    return map;
  }

  // 8. Estadísticas — ESPN para temporada actual + API-Football para datos físicos
  async getPlayerStats(id: string): Promise<PlayerStatsDto | null> {
    const cached = this.statsCache.get(id);
    if (cached && Date.now() - cached.ts < 600_000) return cached.data;

    const player = await this.findOne(id);

    // ── ESPN: stats de la temporada actual (match por número de camiseta) ──
    let espn: EspnStats | null = null;
    if (player.number != null) {
      const roster = await this.fetchEspnRoster();
      espn = roster.get(player.number) ?? null;
    }

    // ── API-Football: solo datos físicos (plan free → hasta 2024, solo se usa altura/peso/nacimiento) ──
    let physical: PhysicalDto | null = null;

    const apiId = player.photo?.split('/').pop()?.replace('.png', '') ?? null;
    if (apiId && process.env.API_FOOTBALL_KEY) {
      for (const season of [2024, 2023]) {
        try {
          const res = await axios.get('https://v3.football.api-sports.io/players', {
            params: { id: apiId, season },
            headers: API_HEADERS(),
            timeout: 10000,
          });
          const entry = res.data?.response?.[0];
          if (!entry) continue;
          const p = entry.player ?? {};
          physical = {
            height: p.height ?? null,
            weight: p.weight ?? null,
            birthDate: p.birth?.date ?? null,
            birthPlace: p.birth?.place ?? null,
            birthCountry: p.birth?.country ?? null,
          };
          break;
        } catch (e: any) {
          this.logger.warn(`API-Football físico falló (${apiId}, ${season}): ${e?.message}`);
        }
      }
    }

    if (!espn && !physical) {
      this.statsCache.set(id, { data: null, ts: Date.now() });
      return null;
    }

    const result: PlayerStatsDto = {
      // Datos físicos (API-Football 2024)
      height: physical?.height ?? null,
      weight: physical?.weight ?? null,
      birthDate: physical?.birthDate ?? null,
      birthPlace: physical?.birthPlace ?? null,
      birthCountry: physical?.birthCountry ?? null,
      // Stats de la temporada actual 2026 (ESPN)
      appearances: espn?.appearances ?? 0,
      goals: espn?.goals ?? 0,
      assists: espn?.assists ?? 0,
      yellowCards: espn?.yellowCards ?? 0,
      redCards: espn?.redCards ?? 0,
      // No mezclamos minutos/titular/rating de 2024 con stats de 2026
      lineups: 0,
      minutes: 0,
      rating: null,
      penaltyGoals: 0,
      season: 2026,
    };

    this.statsCache.set(id, { data: result, ts: Date.now() });
    return result;
  }
}

interface EspnStats {
  fullName: string;
  appearances: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  saves: number;
}

interface PhysicalDto {
  height: string | null;
  weight: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  birthCountry: string | null;
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
// apps/backend/src/players/players.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';

const RIVER_TEAM_ID = 435;

@Injectable()
export class PlayersService {
  private readonly logger = new Logger(PlayersService.name);
  private readonly statsCache = new Map<string, { data: PlayerStatsDto | null; ts: number }>();
  private teamStatsCache: { data: Map<string, PlayerStatsDto>; season: number; ts: number } | null = null;
  private leaderboardCache: { data: LeaderboardEntry[]; ts: number } | null = null;
  private bestSeason: number | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async create(createPlayerDto: CreatePlayerDto) {
    return this.prisma.player.create({ data: createPlayerDto });
  }

  async findAll() {
    return this.prisma.player.findMany({ orderBy: { number: 'asc' } });
  }

  async findOne(id: string) {
    const player = await this.prisma.player.findUnique({ where: { id } });
    if (!player) throw new NotFoundException(`Jugador con ID ${id} no encontrado`);
    return player;
  }

  async update(id: string, updatePlayerDto: any) {
    await this.findOne(id);
    return this.prisma.player.update({ where: { id }, data: updatePlayerDto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.player.delete({ where: { id } });
  }

  // Descarga stats de TODO el plantel en 1-2 llamadas (en vez de 1 por jugador)
  private async fetchAllTeamStats(): Promise<{ data: Map<string, PlayerStatsDto>; season: number }> {
    if (this.teamStatsCache && Date.now() - this.teamStatsCache.ts < 3_600_000) {
      return this.teamStatsCache;
    }

    if (!process.env.API_FOOTBALL_KEY) return { data: new Map(), season: 0 };

    const headers = {
      'x-rapidapi-key': process.env.API_FOOTBALL_KEY,
      'x-rapidapi-host': 'v3.football.api-sports.io',
    };

    const currentYear = new Date().getFullYear();
    const seasons = this.bestSeason
      ? [this.bestSeason, currentYear, currentYear - 1, currentYear - 2].filter((y, i, a) => a.indexOf(y) === i)
      : [currentYear, currentYear - 1, currentYear - 2];

    for (const season of seasons) {
      try {
        const statsMap = new Map<string, PlayerStatsDto>();
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages) {
          const res = await axios.get('https://v3.football.api-sports.io/players', {
            params: { team: RIVER_TEAM_ID, season, page },
            headers,
            timeout: 15000,
          });

          const apiErrors = res.data?.errors;
          if (apiErrors && Object.keys(apiErrors).length > 0) {
            if (apiErrors.requests) {
              this.logger.warn(`API-Football requests agotados: ${apiErrors.requests}`);
              return { data: new Map(), season: 0 };
            }
            this.logger.debug(`API-Football: temporada ${season} fuera del plan, probando anterior...`);
            break;
          }

          totalPages = res.data?.paging?.total ?? 1;
          for (const entry of res.data?.response ?? []) {
            const apiId = String(entry.player?.id);
            const p = entry.player ?? {};
            const st = entry.statistics?.[0] ?? {};
            statsMap.set(apiId, {
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
              assists: st.goals?.assists ?? 0,
              yellowCards: st.cards?.yellow ?? 0,
              redCards: st.cards?.red ?? 0,
              season,
            });
          }

          if (page >= totalPages) break;
          page++;
        }

        if (statsMap.size > 0) {
          this.bestSeason = season;
          this.teamStatsCache = { data: statsMap, season, ts: Date.now() };
          this.logger.log(`API-Football: ${statsMap.size} jugadores cargados (temporada ${season})`);
          return this.teamStatsCache;
        }
      } catch (e: any) {
        this.logger.warn(`API-Football team stats falló (temporada ${season}): ${e?.message}`);
      }
    }

    return { data: new Map(), season: 0 };
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (this.leaderboardCache && Date.now() - this.leaderboardCache.ts < 3_600_000) {
      return this.leaderboardCache.data;
    }

    const [players, { data: teamStats, season }] = await Promise.all([
      this.prisma.player.findMany({ orderBy: { number: 'asc' } }),
      this.fetchAllTeamStats(),
    ]);

    const entries: LeaderboardEntry[] = [];
    for (const p of players) {
      const apiId = p.photo?.split('/').pop()?.replace('.png', '') ?? null;
      if (!apiId) continue;
      const stats = teamStats.get(apiId);
      if (!stats) continue;

      if (!this.statsCache.get(p.id)?.data) {
        this.statsCache.set(p.id, { data: stats, ts: Date.now() });
      }

      entries.push({
        id: p.id,
        name: p.name,
        position: p.position,
        number: p.number,
        photo: p.photo,
        goals: stats.goals,
        assists: stats.assists,
        appearances: stats.appearances,
        season,
      });
    }

    const data = entries.sort((a, b) => b.goals - a.goals || b.assists - a.assists);
    this.leaderboardCache = { data, ts: Date.now() };
    return data;
  }

  async getPlayerStats(id: string): Promise<PlayerStatsDto | null> {
    const cached = this.statsCache.get(id);
    if (cached && Date.now() - cached.ts < 600_000) return cached.data;

    // Usar el cache de equipo si está disponible
    if (this.teamStatsCache && Date.now() - this.teamStatsCache.ts < 3_600_000) {
      const player = await this.findOne(id);
      const apiId = player.photo?.split('/').pop()?.replace('.png', '') ?? null;
      if (apiId) {
        const stats = this.teamStatsCache.data.get(apiId) ?? null;
        this.statsCache.set(id, { data: stats, ts: Date.now() });
        return stats;
      }
    }

    // Fallback: llamada individual
    const player = await this.findOne(id);
    const apiId = player.photo?.split('/').pop()?.replace('.png', '') ?? null;

    if (!apiId || !process.env.API_FOOTBALL_KEY) {
      this.statsCache.set(id, { data: null, ts: Date.now() });
      return null;
    }

    const headers = {
      'x-rapidapi-key': process.env.API_FOOTBALL_KEY,
      'x-rapidapi-host': 'v3.football.api-sports.io',
    };

    const currentYear = new Date().getFullYear();
    const seasons = this.bestSeason
      ? [this.bestSeason, currentYear, currentYear - 1, currentYear - 2].filter((y, i, a) => a.indexOf(y) === i)
      : [currentYear, currentYear - 1, currentYear - 2];

    for (const season of seasons) {
      try {
        const res = await axios.get('https://v3.football.api-sports.io/players', {
          params: { id: apiId, season },
          headers,
          timeout: 10000,
        });

        const apiErrors = res.data?.errors;
        if (apiErrors && Object.keys(apiErrors).length > 0) {
          if (apiErrors.requests) {
            this.logger.warn(`API-Football requests agotados (apiId ${apiId}): ${apiErrors.requests}`);
            this.statsCache.set(id, { data: null, ts: Date.now() });
            return null;
          }
          this.logger.debug(`API-Football: temporada ${season} fuera del plan (apiId ${apiId}), probando anterior...`);
          continue;
        }

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
          assists: st.goals?.assists ?? 0,
          yellowCards: st.cards?.yellow ?? 0,
          redCards: st.cards?.red ?? 0,
          season,
        };

        this.bestSeason = season;
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
  assists: number;
  yellowCards: number;
  redCards: number;
  season: number;
}

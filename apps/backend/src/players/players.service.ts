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

    // Use ESPN season stats (match summaries) instead of N individual API-Football calls
    const [players, espnMap] = await Promise.all([
      this.prisma.player.findMany({ orderBy: { number: 'asc' } }),
      this.fetchEspnRoster(),
    ]);

    const data: LeaderboardEntry[] = players
      .map((p) => {
        const espn = this.matchEspnPlayer(espnMap, p.name);
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

  // ESPN season stats cache: ESPN displayName → stats acumuladas de todos los partidos
  private espnRosterCache: { data: Map<string, EspnStats>; ts: number } | null = null;

  private async fetchEspnRoster(): Promise<Map<string, EspnStats>> {
    if (this.espnRosterCache && Date.now() - this.espnRosterCache.ts < 6 * 3_600_000) {
      return this.espnRosterCache.data;
    }

    // nameStats keyed by ESPN displayName (lowercase) → stats
    const nameStats = new Map<string, EspnStats>();
    // athleteIds: espn athlete id → displayName (collected from match rosters)
    const athleteIds = new Map<string, string>();

    const ensure = (name: string) => {
      const key = name.toLowerCase();
      if (!nameStats.has(key)) nameStats.set(key, { fullName: name, appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, saves: 0 });
      return nameStats.get(key)!;
    };

    try {
      // 1. Get all River matches in arg.1 AND conmebol.sudamericana this season
      const LEAGUES = ['arg.1', 'conmebol.sudamericana'];
      const now = Date.now();

      const allSchedules = await Promise.all(
        LEAGUES.map((league) =>
          axios
            .get(
              `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/16/schedule?season=2026`,
              { timeout: 15000 },
            )
            .then((r) => ({ league, events: r.data?.events ?? [] }))
            .catch(() => ({ league, events: [] })),
        ),
      );

      const seenIds = new Set<string>();
      const leagueEventIds: Array<{ league: string; eid: string }> = [];
      for (const { league, events } of allSchedules) {
        for (const e of events) {
          if (e.id && new Date(e.date).getTime() < now && !seenIds.has(e.id)) {
            seenIds.add(e.id);
            leagueEventIds.push({ league, eid: e.id });
          }
        }
      }

      this.logger.log(`ESPN: ${leagueEventIds.length} partidos completados (arg.1 + sudamericana 2026)`);

      // 2. Fetch match summaries to collect appearances + ESPN athlete IDs from rosters
      await Promise.all(
        leagueEventIds.map(async ({ league, eid }) => {
          try {
            const res = await axios.get(
              `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${eid}`,
              { timeout: 10000 },
            );
            const data = res.data ?? {};

            for (const teamRoster of data.rosters ?? []) {
              if (teamRoster.team?.id !== '16') continue;
              for (const entry of teamRoster.roster ?? []) {
                const name: string = entry.athlete?.displayName ?? '';
                const aid: string = String(entry.athlete?.id ?? '');
                if (!name) continue;
                ensure(name).appearances++;
                if (aid && !athleteIds.has(aid)) athleteIds.set(aid, name);
              }
            }
          } catch (e: any) {
            this.logger.warn(`ESPN summary ${eid} falló: ${e.message}`);
          }
        }),
      );
    } catch (e: any) {
      this.logger.warn(`ESPN schedule fetch falló: ${e.message}`);
    }

    this.logger.log(`ESPN: ${athleteIds.size} atletas únicos encontrados, obteniendo stats individuales...`);

    // 3. Fetch exact season stats per athlete from ESPN athlete overview
    //    Labels order: ["STRT","FC","FA","YC","RC","G","A","SH","ST","OF"]
    const G_IDX = 5, A_IDX = 6, YC_IDX = 3, RC_IDX = 4;

    await Promise.all(
      [...athleteIds.entries()].map(async ([aid, displayName]) => {
        try {
          const res = await axios.get(
            `https://site.web.api.espn.com/apis/common/v3/sports/soccer/athletes/${aid}/overview`,
            { timeout: 10000 },
          );
          const splits: any[] = res.data?.statistics?.splits ?? [];
          let goals = 0, assists = 0, yellowCards = 0, redCards = 0;
          for (const split of splits) {
            if (!String(split.displayName ?? '').includes('2026')) continue;
            const s: any[] = split.stats ?? [];
            goals += Number(s[G_IDX]) || 0;
            assists += Number(s[A_IDX]) || 0;
            yellowCards += Number(s[YC_IDX]) || 0;
            redCards += Number(s[RC_IDX]) || 0;
          }
          const entry = ensure(displayName);
          entry.goals = goals;
          entry.assists = assists;
          entry.yellowCards = yellowCards;
          entry.redCards = redCards;
        } catch {
          // keep appearance count, skip stats
        }
      }),
    );

    this.logger.log(`ESPN stats acumuladas: ${nameStats.size} jugadores`);
    if (nameStats.size > 0) {
      const top = [...nameStats.values()].sort((a, b) => b.goals - a.goals).slice(0, 5);
      this.logger.log('Top goleadores: ' + top.map(p => `${p.fullName}(${p.goals})`).join(', '));
    }

    this.espnRosterCache = { data: nameStats, ts: Date.now() };
    return nameStats;
  }

  // Match ESPN displayName → DB player name (API-Football abbreviated: "S. Driussi" → "driussi")
  private matchEspnPlayer(espnMap: Map<string, EspnStats>, dbName: string): EspnStats | null {
    // Extract last name(s) from DB name: "S. Driussi" → "driussi", "L. Martínez Quarta" → "martínez quarta"
    const dbLastName = dbName.replace(/^[A-ZÁÉÍÓÚ]\.\s+/, '').toLowerCase().trim();

    // Try exact lowercase match first
    for (const [key, stats] of espnMap) {
      const espnLastName = stats.fullName.split(' ').slice(1).join(' ').toLowerCase().trim();
      if (espnLastName === dbLastName || key === dbLastName) return stats;
    }
    // Fallback: last word match
    const dbLastWord = dbLastName.split(' ').pop() ?? '';
    for (const stats of espnMap.values()) {
      const espnLastWord = stats.fullName.split(' ').pop()?.toLowerCase() ?? '';
      if (espnLastWord === dbLastWord && dbLastWord.length > 3) return stats;
    }
    return null;
  }

  // 8. Estadísticas — ESPN para temporada actual + API-Football para datos físicos
  async getPlayerStats(id: string): Promise<PlayerStatsDto | null> {
    const cached = this.statsCache.get(id);
    if (cached && Date.now() - cached.ts < 600_000) return cached.data;

    const player = await this.findOne(id);

    // ── ESPN: stats de la temporada actual (todos los partidos, match por apellido) ──
    const espnMap = await this.fetchEspnRoster();
    const espn = this.matchEspnPlayer(espnMap, player.name);

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
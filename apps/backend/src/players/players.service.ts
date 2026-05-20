// apps/backend/src/players/players.service.ts
import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
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
    const updated = await this.prisma.player.update({
      where: { id },
      data: updatePlayerDto,
    });
    this.statsCache.delete(id);
    this.leaderboardCache = null;
    return updated;
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
          goals: p.manualGoals ?? espn?.goals ?? 0,
          assists: p.manualAssists ?? espn?.assists ?? 0,
          appearances: p.manualAppearances ?? espn?.appearances ?? 0,
          season: 2026,
        } as LeaderboardEntry;
      })
      .filter((e) => e.appearances > 0 || e.goals > 0 || e.assists > 0)
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

  /**
   * Intenta detectar lesionados desde ESPN (team injuries endpoint).
   * Si encuentra a alguien, lo marca como 'injured' en la DB. Nunca pisa estados manuales
   * (no resetea injured → available automáticamente).
   */
  async syncInjuriesFromEspn(): Promise<{ synced: number; matched: number; espnFound: number }> {
    const ESPN_TEAM_IDS = [16]; // River Plate en arg.1
    const LEAGUES_FOR_INJURIES = ['arg.1', 'conmebol.libertadores', 'conmebol.sudamericana'];

    const players = await this.prisma.player.findMany();
    if (players.length === 0) return { synced: 0, matched: 0, espnFound: 0 };

    // Intentar multiples endpoints (algunos solo tienen data en ciertas ligas)
    const injuredNames = new Map<string, { type: string; date?: string }>();
    for (const league of LEAGUES_FOR_INJURIES) {
      for (const teamId of ESPN_TEAM_IDS) {
        try {
          const res = await axios.get(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/${teamId}/injuries`,
            { timeout: 10000 },
          );
          const list: any[] = res.data?.injuries ?? res.data?.items ?? [];
          for (const item of list) {
            const athleteName: string = item.athlete?.displayName ?? item.athlete?.shortName ?? '';
            if (!athleteName) continue;
            injuredNames.set(athleteName.toLowerCase(), {
              type: item.status ?? item.type?.description ?? 'Lesión',
              date: item.date,
            });
          }
        } catch (e: any) {
          this.logger.warn(`ESPN injuries ${league}/${teamId} falló: ${e?.message}`);
        }
      }
    }

    let matched = 0;
    if (injuredNames.size > 0) {
      const norm = (s: string) =>
        s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

      for (const player of players) {
        const dbStripped = player.name.replace(/^[A-Za-zÀ-ÿ]\.\s+/, '');
        const dbN = norm(dbStripped);
        const lastWord = dbN.split(' ').pop() ?? '';
        let injuryInfo: { type: string; date?: string } | null = null;
        for (const [espnName, info] of injuredNames) {
          const espnN = norm(espnName);
          if (espnN === dbN || espnN.endsWith(' ' + lastWord) || espnN === lastWord) {
            injuryInfo = info;
            break;
          }
        }
        if (injuryInfo && player.status !== 'injured') {
          await this.prisma.player.update({
            where: { id: player.id },
            data: { status: 'injured', injuryType: injuryInfo.type },
          });
          matched++;
          this.logger.log(`  → Lesionado (ESPN): ${player.name} - ${injuryInfo.type}`);
        }
      }
    }

    return { synced: players.length, matched, espnFound: injuredNames.size };
  }

  /**
   * Sincronización legacy via API-Football (requiere plan premium).
   * Solo MARCA lesionados nuevos; nunca pisa status manuales.
   */
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
      }
      // NOTA: si un jugador estaba marcado como injured y la API no lo trae,
      // NO lo reseteamos automáticamente — eso pisaba ediciones manuales del admin.
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

  /**
   * Match ESPN displayName → DB player name.
   * DB suele venir abreviado de API-Football: "S. Driussi", "M. Salas". ESPN trae full name.
   * Normalizamos sin tildes/diacríticos para evitar falsos negativos (Martinez vs Martínez).
   */
  private matchEspnPlayer(espnMap: Map<string, EspnStats>, dbName: string): EspnStats | null {
    const norm = (s: string) =>
      s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

    // Quitar prefijo abreviado tipo "S. " o "L. "
    const dbStripped = dbName.replace(/^[A-Za-zÀ-ÿ]\.\s+/, '');
    const dbN = norm(dbStripped);
    const dbLastWord = dbN.split(' ').pop() ?? '';

    // 1) Match exacto del fullName normalizado (incluye match parcial inicial: "driussi" === "driussi")
    for (const [key, stats] of espnMap) {
      const espnFullN = norm(stats.fullName);
      const espnKey = norm(key);
      if (espnFullN === dbN || espnKey === dbN) return stats;
    }

    // 2) Match por apellido(s) completo: "martinez quarta" vs ESPN "martinez quarta"
    for (const stats of espnMap.values()) {
      const espnLastN = norm(stats.fullName.split(' ').slice(1).join(' '));
      if (espnLastN && espnLastN === dbN) return stats;
    }

    // 3) Match por última palabra (apellido) ≥ 4 letras para reducir falsos positivos
    if (dbLastWord.length >= 4) {
      for (const stats of espnMap.values()) {
        const espnLastWord = norm(stats.fullName.split(' ').pop() ?? '');
        if (espnLastWord === dbLastWord) return stats;
      }
    }

    // 4) Match por inicial + apellido: "S. Driussi" → ESPN "Sebastian Driussi"
    const initialMatch = dbName.match(/^([A-Za-zÀ-ÿ])\.\s+(.+)$/);
    if (initialMatch) {
      const initial = norm(initialMatch[1]);
      const last = norm(initialMatch[2]);
      for (const stats of espnMap.values()) {
        const parts = stats.fullName.split(' ');
        if (parts.length < 2) continue;
        const espnFirstInitial = norm(parts[0])[0];
        const espnLast = norm(parts.slice(1).join(' '));
        if (espnFirstInitial === initial && espnLast === last) return stats;
      }
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

    const hasManualOverride =
      player.manualGoals != null ||
      player.manualAssists != null ||
      player.manualAppearances != null ||
      player.manualMinutes != null ||
      player.manualYellowCards != null ||
      player.manualRedCards != null;

    if (!espn && !physical && !hasManualOverride) {
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
      // Stats temporada actual: manual override > ESPN > 0
      appearances: player.manualAppearances ?? espn?.appearances ?? 0,
      goals: player.manualGoals ?? espn?.goals ?? 0,
      assists: player.manualAssists ?? espn?.assists ?? 0,
      yellowCards: player.manualYellowCards ?? espn?.yellowCards ?? 0,
      redCards: player.manualRedCards ?? espn?.redCards ?? 0,
      lineups: 0,
      minutes: player.manualMinutes ?? 0,
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
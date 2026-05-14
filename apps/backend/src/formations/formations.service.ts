// apps/backend/src/formations/formations.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormationDto } from './dto/create-formation.dto';

export type SlotRole = 'GK' | 'DEF' | 'MID' | 'ATK';

export interface PitchSlot {
  x: number;
  y: number;
  role: SlotRole;
}

export interface LineupPlayer {
  id: string;
  name: string;
  number: number | null;
  photo: string | null;
  nationality: string | null;
  position: string;
  virtual?: boolean;
}

export interface LineupEntry extends PitchSlot {
  player: LineupPlayer | null;
}

export interface PlayerAlert {
  playerId: string;
  type: 'injury' | 'suspension';
  detail: string;
  replacementId?: string;
}

export interface LineupResponse {
  scheme: string;
  schemes: string[];
  lineup: LineupEntry[];
  bench: LineupPlayer[];
  source: 'last-match' | 'algorithm';
  lastMatchInfo?: { opponent: string; date: string; competition: string };
  alerts: PlayerAlert[];
}

// ── Internos ──────────────────────────────────────────────────────────────────

interface VirtualStarter {
  name: string;
  jersey: number | null;
  role: SlotRole;
}

interface LineupBaseData {
  starterIds: Set<string>;
  virtualStarters: VirtualStarter[];
  matchInfo?: LineupResponse['lastMatchInfo'];
  alerts: PlayerAlert[];
  source: 'last-match' | 'algorithm';
  ts: number;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const SUPPORTED_SCHEMES = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2'];

const POSITION_TO_ROLE: Record<string, SlotRole> = {
  Goalkeeper: 'GK',
  Defender: 'DEF',
  Midfielder: 'MID',
  Attacker: 'ATK',
};

const ESPN_LEAGUES = [
  'arg.1',
  'conmebol.libertadores',
  'conmebol.sudamericana',
  'arg.copa_argentina',
  'conmebol.recopa_sudamericana',
];

const ESPN_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; RiverAppBot/2.0)' };
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 horas
const RIVER_RX = /river\s*plate/i;

const ESPN_POS_MAP: Record<string, SlotRole> = {
  G: 'GK', GK: 'GK',
  D: 'DEF', CB: 'DEF', LB: 'DEF', RB: 'DEF', WB: 'DEF', SW: 'DEF',
  M: 'MID', CM: 'MID', CAM: 'MID', CDM: 'MID', LM: 'MID', RM: 'MID', DM: 'MID',
  F: 'ATK', LW: 'ATK', RW: 'ATK', CF: 'ATK', SS: 'ATK', FW: 'ATK',
};

@Injectable()
export class FormationsService {
  constructor(private prisma: PrismaService) {}

  private baseCache: LineupBaseData | null = null;

  // ── CRUD ──────────────────────────────────────────────────────────────────────

  async create(createFormationDto: CreateFormationDto) {
    const { matchId } = createFormationDto;
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException(`El partido con ID ${matchId} no existe.`);
    return this.prisma.formation.create({ data: createFormationDto });
  }

  async findAll() {
    return this.prisma.formation.findMany({ include: { match: true } });
  }

  async findOne(id: string) {
    const formation = await this.prisma.formation.findUnique({ where: { id }, include: { match: true } });
    if (!formation) throw new NotFoundException(`La formación con ID ${id} no existe.`);
    return formation;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.formation.delete({ where: { id } });
  }

  // ── Lineup táctico ────────────────────────────────────────────────────────────

  async getLineup(rawScheme?: string, forceRefresh = false): Promise<LineupResponse> {
    const scheme = SUPPORTED_SCHEMES.includes(rawScheme ?? '') ? rawScheme! : '4-3-3';
    const slots = this.computeSlots(scheme);

    if (forceRefresh) this.baseCache = null;

    const base = await this.buildBaseData();

    const allPlayers = await this.prisma.player.findMany({
      orderBy: [{ number: 'asc' }, { name: 'asc' }],
    });

    // Pools por rol, filtrando starters reales primero
    const pools: Record<SlotRole, typeof allPlayers> = { GK: [], DEF: [], MID: [], ATK: [] };
    for (const p of allPlayers) {
      const role = POSITION_TO_ROLE[p.position];
      if (!role) continue;
      if (base.starterIds.size > 0) {
        if (base.starterIds.has(p.id)) pools[role].unshift(p);
        else pools[role].push(p);
      } else {
        pools[role].push(p);
      }
    }

    // Virtual pools (jugadores ESPN no encontrados en DB)
    const virtualPools: Record<SlotRole, VirtualStarter[]> = { GK: [], DEF: [], MID: [], ATK: [] };
    for (const v of base.virtualStarters) virtualPools[v.role].push(v);

    const used = new Set<string>();
    const lineup: LineupEntry[] = slots.map((slot) => {
      const dbPool = pools[slot.role] ?? [];
      const dbPlayer = dbPool.find((p) => !used.has(p.id));
      if (dbPlayer) {
        used.add(dbPlayer.id);
        return { ...slot, player: this.toLineupPlayer(dbPlayer) };
      }
      const vPool = virtualPools[slot.role];
      const virtual = vPool.shift();
      if (virtual) return { ...slot, player: this.toVirtualPlayer(virtual) };
      return { ...slot, player: null };
    });

    const bench: LineupPlayer[] = allPlayers
      .filter((p) => !used.has(p.id))
      .map((p) => this.toLineupPlayer(p));

    return {
      scheme,
      schemes: SUPPORTED_SCHEMES,
      lineup,
      bench,
      source: base.source,
      lastMatchInfo: base.matchInfo,
      alerts: base.alerts,
    };
  }

  // ── Base data (ESPN + alertas) ────────────────────────────────────────────────

  private async buildBaseData(): Promise<LineupBaseData> {
    if (this.baseCache && Date.now() - this.baseCache.ts < CACHE_TTL) {
      return this.baseCache;
    }

    const allPlayers = await this.prisma.player.findMany({
      select: { id: true, name: true, number: true, position: true },
    });

    const [espnResult, alerts] = await Promise.all([
      this.fetchLastMatchLineup(allPlayers),
      this.detectInjuryAlerts(allPlayers),
    ]);

    const data: LineupBaseData = {
      starterIds: espnResult?.starterIds ?? new Set(),
      virtualStarters: espnResult?.virtualStarters ?? [],
      matchInfo: espnResult?.matchInfo,
      alerts,
      source: (espnResult?.starterIds.size ?? 0) + (espnResult?.virtualStarters.length ?? 0) >= 5
        ? 'last-match'
        : 'algorithm',
      ts: Date.now(),
    };

    this.baseCache = data;
    return data;
  }

  // ── ESPN: buscar último partido de River ──────────────────────────────────────

  private async fetchLastMatchLineup(allPlayers: { id: string; name: string; number: number | null; position: string }[]): Promise<{
    starterIds: Set<string>;
    virtualStarters: VirtualStarter[];
    matchInfo?: LineupResponse['lastMatchInfo'];
  } | null> {
    try {
      const now = new Date();
      const from = new Date(now);
      from.setDate(from.getDate() - 45);
      const dateRange = `${this.fmtDate(from)}-${this.fmtDate(now)}`;

      // Buscar en todas las ligas en paralelo
      const scoreboardResults = await Promise.allSettled(
        ESPN_LEAGUES.map((league) =>
          axios.get(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${dateRange}`,
            { headers: ESPN_HEADERS, timeout: 8000 },
          ).then((r) => ({ league, events: r.data?.events ?? [] as any[] })),
        ),
      );

      // Recolectar todos los eventos de River terminados
      type MatchCandidate = { league: string; eventId: string; date: Date; opponent: string; competition: string };
      const candidates: MatchCandidate[] = [];

      for (const result of scoreboardResults) {
        if (result.status !== 'fulfilled') continue;
        const { league, events } = result.value;
        for (const event of events) {
          const comp = event.competitions?.[0];
          if (!comp) continue;
          const status = comp.status?.type?.name ?? comp.status?.type?.state ?? '';
          if (!['STATUS_FINAL', 'STATUS_FULL_TIME', 'completed', 'post'].some((s) => status.toLowerCase().includes(s.toLowerCase()))) continue;
          const competitors: any[] = comp.competitors ?? [];
          const hasRiver = competitors.some((c: any) => RIVER_RX.test(c.team?.displayName ?? c.team?.name ?? ''));
          if (!hasRiver) continue;
          const rival = competitors.find((c: any) => !RIVER_RX.test(c.team?.displayName ?? c.team?.name ?? ''));
          candidates.push({
            league,
            eventId: event.id,
            date: new Date(event.date ?? comp.date),
            opponent: rival?.team?.displayName ?? rival?.team?.name ?? 'Rival',
            competition: event.season?.type?.name ?? event.name ?? league,
          });
        }
      }

      if (candidates.length === 0) return null;

      // Ordenar por fecha descendente → partido más reciente primero
      candidates.sort((a, b) => b.date.getTime() - a.date.getTime());
      const latest = candidates[0];

      // Pedir summary del evento
      const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${latest.league}/summary?event=${latest.eventId}`;
      const summaryRes = await axios.get(summaryUrl, { headers: ESPN_HEADERS, timeout: 8000 });
      const summary = summaryRes.data;

      // Extraer roster de River
      const riverRoster = this.extractRiverRoster(summary);
      if (!riverRoster || riverRoster.length === 0) return null;

      // Mapear a jugadores DB o virtuales
      const starterIds = new Set<string>();
      const virtualStarters: VirtualStarter[] = [];

      for (const espnPlayer of riverRoster) {
        const dbMatch = this.matchEspnPlayerToDb(espnPlayer.name, espnPlayer.jersey, allPlayers);
        if (dbMatch) {
          starterIds.add(dbMatch.id);
        } else {
          virtualStarters.push({
            name: espnPlayer.name,
            jersey: espnPlayer.jersey,
            role: this.espnPositionToRole(espnPlayer.posAbbr),
          });
        }
      }

      return {
        starterIds,
        virtualStarters,
        matchInfo: {
          opponent: latest.opponent,
          date: latest.date.toISOString(),
          competition: latest.competition,
        },
      };
    } catch (e: any) {
      console.error('FormationsService ESPN error:', e?.message);
      return null;
    }
  }

  private extractRiverRoster(summary: any): Array<{ name: string; jersey: number | null; posAbbr: string; starter: boolean }> | null {
    // Intentar rosters[]
    const rosters: any[] = summary?.rosters ?? [];
    for (const teamRoster of rosters) {
      const teamName: string = teamRoster?.team?.displayName ?? teamRoster?.team?.name ?? '';
      if (!RIVER_RX.test(teamName)) continue;
      const entries: any[] = teamRoster?.roster ?? teamRoster?.athletes ?? [];
      const starters = this.parseRosterEntries(entries);
      if (starters.length > 0) return starters;
    }

    // Intentar boxscore.players[]
    const bsPlayers: any[] = summary?.boxscore?.players ?? [];
    for (const teamData of bsPlayers) {
      const teamName: string = teamData?.team?.displayName ?? teamData?.team?.name ?? '';
      if (!RIVER_RX.test(teamName)) continue;
      const entries: any[] = teamData?.athletes ?? teamData?.statistics ?? [];
      const starters = this.parseRosterEntries(entries);
      if (starters.length > 0) return starters;
    }

    return null;
  }

  private parseRosterEntries(entries: any[]): Array<{ name: string; jersey: number | null; posAbbr: string; starter: boolean }> {
    const result: Array<{ name: string; jersey: number | null; posAbbr: string; starter: boolean }> = [];
    for (const entry of entries) {
      const athlete = entry?.athlete ?? entry;
      const name: string = athlete?.displayName ?? athlete?.shortName ?? athlete?.fullName ?? '';
      if (!name) continue;
      const jersey = athlete?.jersey != null ? parseInt(String(athlete.jersey), 10) : null;
      const posAbbr: string = (athlete?.position?.abbreviation ?? athlete?.position ?? '').toUpperCase();
      const isStarter: boolean =
        entry?.starter === true ||
        entry?.starter === 'true' ||
        entry?.startsAtPosition != null ||
        entry?.period === 1;
      result.push({ name, jersey: isNaN(jersey as number) ? null : jersey, posAbbr, starter: isStarter });
    }

    // Si ninguno tiene starter=true, tomar los primeros 11 (ESPN los ordena titulares primero)
    const markedStarters = result.filter((p) => p.starter);
    if (markedStarters.length >= 7) return markedStarters.slice(0, 11);
    return result.slice(0, 11);
  }

  // ── Matching ESPN → DB ────────────────────────────────────────────────────────

  private matchEspnPlayerToDb(
    name: string,
    jersey: number | null,
    players: { id: string; name: string; number: number | null }[],
  ): { id: string } | null {
    // 1. Por dorsal (más confiable)
    if (jersey != null) {
      const byJersey = players.find((p) => p.number === jersey);
      if (byJersey) return byJersey;
    }
    // 2. Fuzzy por nombre
    return this.fuzzyMatchPlayer(name, players);
  }

  private fuzzyMatchPlayer(
    name: string,
    players: { id: string; name: string }[],
  ): { id: string } | null {
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    const n = norm(name);

    // Coincidencia exacta
    let match = players.find((p) => norm(p.name) === n);
    if (match) return match;

    // Apellido
    const lastName = n.split(' ').pop() ?? n;
    match = players.find((p) => norm(p.name).split(' ').pop() === lastName);
    if (match) return match;

    // Primer nombre + apellido
    const parts = n.split(' ');
    if (parts.length >= 2) {
      const first = parts[0];
      const last = parts[parts.length - 1];
      match = players.find((p) => {
        const pp = norm(p.name).split(' ');
        return pp[0] === first && pp[pp.length - 1] === last;
      });
      if (match) return match;
    }

    return null;
  }

  private espnPositionToRole(abbr: string): SlotRole {
    return ESPN_POS_MAP[abbr] ?? 'MID';
  }

  // ── Alertas de lesiones / suspensiones ───────────────────────────────────────

  private async detectInjuryAlerts(
    players: { id: string; name: string }[],
  ): Promise<PlayerAlert[]> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - 7);

      const news = await this.prisma.news.findMany({
        where: { createdAt: { gte: since } },
        select: { title: true, body: true },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });

      const injuryRx = /lesion|lesionado|baja|descartado/i;
      const suspRx = /suspendido|suspensión|tarjeta\s+roja|expulsado/i;

      const alerts: PlayerAlert[] = [];
      const alreadyAlerted = new Set<string>();

      for (const article of news) {
        const text = `${article.title} ${article.body}`;
        for (const p of players) {
          if (alreadyAlerted.has(p.id)) continue;
          const lastName = p.name.split(' ').pop() ?? p.name;
          if (!new RegExp(lastName, 'i').test(text)) continue;
          if (injuryRx.test(text)) {
            alerts.push({ playerId: p.id, type: 'injury', detail: `${p.name} — posible baja por lesión` });
            alreadyAlerted.add(p.id);
          } else if (suspRx.test(text)) {
            alerts.push({ playerId: p.id, type: 'suspension', detail: `${p.name} — posible baja por suspensión` });
            alreadyAlerted.add(p.id);
          }
        }
      }

      return alerts;
    } catch {
      return [];
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private toLineupPlayer(p: {
    id: string; name: string; number: number | null;
    photo: string | null; nationality: string | null; position: string;
  }): LineupPlayer {
    return { id: p.id, name: p.name, number: p.number, photo: p.photo, nationality: p.nationality, position: p.position };
  }

  private toVirtualPlayer(v: VirtualStarter): LineupPlayer {
    return {
      id: `virtual-${v.jersey ?? v.name}`,
      name: v.name,
      number: v.jersey,
      photo: null,
      nationality: null,
      position: v.role === 'GK' ? 'Goalkeeper' : v.role === 'DEF' ? 'Defender' : v.role === 'MID' ? 'Midfielder' : 'Attacker',
      virtual: true,
    };
  }

  async getHistory(limit = 12) {
    const matches = await this.prisma.match.findMany({
      where: {
        status: 'finished',
        OR: [
          { homeTeam: { contains: 'River', mode: 'insensitive' } },
          { awayTeam: { contains: 'River', mode: 'insensitive' } },
        ],
      },
      orderBy: { date: 'desc' },
      take: limit,
      select: {
        id: true,
        date: true,
        homeTeam: true,
        awayTeam: true,
        homeScore: true,
        awayScore: true,
        competition: true,
        Formation: { select: { scheme: true }, take: 1 },
      },
    });
    return matches.map((m) => ({
      matchId: m.id,
      date: m.date,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      competition: m.competition,
      scheme: m.Formation[0]?.scheme ?? null,
    }));
  }

  private fmtDate(d: Date): string {
    return d.toISOString().slice(0, 10).replace(/-/g, '');
  }

  // ── computeSlots ──────────────────────────────────────────────────────────────

  private computeSlots(scheme: string): PitchSlot[] {
    const lines = scheme.split('-').map((n) => parseInt(n, 10));
    const slots: PitchSlot[] = [];
    slots.push({ x: 50, y: 92, role: 'GK' });

    const yDef = 70;
    const yAtk = 18;
    const lineCount = lines.length;

    for (let li = 0; li < lineCount; li++) {
      const t = lineCount === 1 ? 0.5 : li / (lineCount - 1);
      const y = yDef - t * (yDef - yAtk);
      const role: SlotRole = li === 0 ? 'DEF' : li === lineCount - 1 ? 'ATK' : 'MID';
      const playersInLine = lines[li];
      for (let pi = 0; pi < playersInLine; pi++) {
        const x = ((pi + 1) * 100) / (playersInLine + 1);
        slots.push({ x, y, role });
      }
    }

    return slots;
  }
}

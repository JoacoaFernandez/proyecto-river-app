// matches.service.ts — versión con descubrimiento dinámico de IDs + fixes
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

const RIVER_CANON = 'River Plate';
const RIVER_NAMES = ['river plate', 'club atletico river plate', 'club atlético river plate'];

const ESPN_LEAGUES = [
  { code: 'arg.1',                 name: 'Liga Profesional Argentina' },
  { code: 'conmebol.libertadores', name: 'Copa Libertadores' },
  { code: 'conmebol.sudamericana', name: 'Copa Sudamericana' },
];

const AXIOS_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; RiverAppBot/2.0)',
  Accept: 'application/json',
};

const normalizeStr = (s: string) =>
  s.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

const isRiverArgentina = (name?: string, country?: string): boolean => {
  if (!name) return false;
  const n = normalizeStr(name);
  const hasRiver = RIVER_NAMES.some(r => n.includes(r));
  if (!hasRiver) return false;
  if (country) {
    const c = normalizeStr(country);
    if (c.includes('uruguay') || c.includes('brasil') || c.includes('chile')) return false;
  }
  return true;
};

const isRiver = (name?: string): boolean =>
  !!name && RIVER_NAMES.some(r => normalizeStr(name).includes(r));

function normalizeTeams(
  homeTeam: string, awayTeam: string,
  homeScore: number | null, awayScore: number | null,
) {
  if (isRiver(awayTeam) && !isRiver(homeTeam)) {
    return { homeTeam: RIVER_CANON, awayTeam: homeTeam, homeScore: awayScore, awayScore: homeScore };
  }
  return {
    homeTeam: isRiver(homeTeam) ? RIVER_CANON : homeTeam,
    awayTeam: isRiver(awayTeam) ? RIVER_CANON : awayTeam,
    homeScore,
    awayScore,
  };
}

function dedup(matches: any[]): any[] {
  const seen = new Set<string>();
  return matches.filter(m => {
    try {
      const key = `${new Date(m.date).toISOString()}|${normalizeStr(m.homeTeam)}|${normalizeStr(m.awayTeam)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    } catch { return true; }
  });
}

@Injectable()
export class MatchesService implements OnModuleInit {
  private readonly logger = new Logger(MatchesService.name);

  private sportsDbTeamId: string | null = null;
  private espnTeamId: string | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('⚡ Motor de Fixture River Plate iniciando...');
    setTimeout(() => this.syncMatches(), 3000);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    await this.syncMatches();
  }

  // ── CRUD admin ───────────────────────────────────────────────────────────────

  async findAll() {
    return this.prisma.match.findMany({ orderBy: { date: 'asc' } });
  }

  async findOne(id: string) {
    return this.prisma.match.findUnique({ where: { id } });
  }

  async createManual(data: {
    homeTeam: string;
    awayTeam: string;
    date: string;
    competition?: string;
    stadium?: string;
    status?: string;
  }) {
    const type = `MANUAL_${Date.now()}`;
    return this.prisma.match.create({
      data: {
        type,
        homeTeam: data.homeTeam,
        awayTeam: data.awayTeam,
        date: new Date(data.date),
        competition: data.competition ?? 'Amistoso',
        stadium: data.stadium,
        status: data.status ?? 'scheduled',
        homeScore: 0,
        awayScore: 0,
        manualOverride: true,
      },
    });
  }

  async updateMatch(
    id: string,
    data: {
      status?: string;
      homeScore?: number;
      awayScore?: number;
      minute?: number;
      competition?: string;
      stadium?: string;
      date?: string;
    },
  ) {
    const update: any = {};
    if (data.status !== undefined) update.status = data.status;
    if (data.homeScore !== undefined) update.homeScore = data.homeScore;
    if (data.awayScore !== undefined) update.awayScore = data.awayScore;
    if (data.minute !== undefined) update.minute = data.minute;
    if (data.competition !== undefined) update.competition = data.competition;
    if (data.stadium !== undefined) update.stadium = data.stadium;
    if (data.date !== undefined) update.date = new Date(data.date);
    return this.prisma.match.update({ where: { id }, data: update });
  }

  async removeMatch(id: string) {
    return this.prisma.match.delete({ where: { id } });
  }

  // ── Queries públicas ─────────────────────────────────────────────────────────

  async getUpcomingMatches(limit = 10) {
    const now = new Date();
    // Margen de 3h hacia atrás para absorber diferencias de timezone de las APIs
    const cutoff = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    return this.prisma.match.findMany({
      where: {
        OR: [
          { status: 'live' },
          { AND: [{ status: 'scheduled' }, { date: { gte: cutoff } }] },
        ],
      },
      orderBy: { date: 'asc' },
      take: limit,
    });
  }

  async getPastMatches(limit = 20) {
    return this.prisma.match.findMany({
      where: { status: 'finished' },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async getH2H(rival: string, limit = 6) {
    if (!rival?.trim()) return [];
    const term = rival.trim();
    return this.prisma.match.findMany({
      where: {
        status: 'finished',
        OR: [
          { homeTeam: { contains: term, mode: 'insensitive' } },
          { awayTeam: { contains: term, mode: 'insensitive' } },
        ],
      },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async getLatestMatch() {
    const now = new Date();

    // 1. Partido en vivo
    const live = await this.prisma.match.findFirst({
      where: { status: 'live' },
      orderBy: { date: 'desc' },
    });
    if (live) return live;

    // 2. Próximo partido futuro
    const next = await this.prisma.match.findFirst({
      where: { status: 'scheduled', date: { gte: now } },
      orderBy: { date: 'asc' },
    });
    if (next) return next;

    // 3. Cualquier partido scheduled (aunque la fecha ya pasó — delay de API)
    const anyScheduled = await this.prisma.match.findFirst({
      where: { status: 'scheduled' },
      orderBy: { date: 'asc' },
    });
    if (anyScheduled) return anyScheduled;

    // 4. Último partido terminado
    const latest = await this.prisma.match.findFirst({
      where: { status: 'finished' },
      orderBy: { date: 'desc' },
    });
    return latest ?? null;
  }

  async getAllGrouped() {
    const [upcoming, past] = await Promise.all([
      this.getUpcomingMatches(50),
      this.getPastMatches(200),
    ]);
    return { upcoming, past };
  }

  // ── Debug ────────────────────────────────────────────────────────────────────

  async getDebugInfo() {
    const all = await this.prisma.match.findMany({ orderBy: { date: 'asc' } });
    return {
      total: all.length,
      byStatus: {
        live:      all.filter(m => m.status === 'live').length,
        scheduled: all.filter(m => m.status === 'scheduled').length,
        finished:  all.filter(m => m.status === 'finished').length,
      },
      types: [...new Set(all.map(m => m.type))],
      sample: all.slice(0, 5).map(m => ({
        type:        m.type,
        status:      m.status,
        date:        m.date,
        home:        m.homeTeam,
        away:        m.awayTeam,
        competition: m.competition,
      })),
      upcoming: all
        .filter(m => m.status === 'scheduled')
        .slice(0, 3)
        .map(m => ({ date: m.date, home: m.homeTeam, away: m.awayTeam, status: m.status })),
    };
  }

  // ── Motor de sincronización ──────────────────────────────────────────────────

  async syncMatches() {
    try {
      this.logger.log('🔄 Sincronizando fixture River Plate...');
      let matches: any[] = [];

      if (!matches.length) {
        this.logger.log('📡 [1/4] TheSportsDB...');
        matches = await this.fetchFromTheSportsDB();
        this.logger.log(matches.length ? `✅ TheSportsDB: ${matches.length} partidos.` : '❌ TheSportsDB: 0 partidos.');
      }

      if (!matches.length) {
        this.logger.log('📡 [2/4] ESPN API...');
        matches = await this.fetchFromEspnApi();
        this.logger.log(matches.length ? `✅ ESPN: ${matches.length} partidos.` : '❌ ESPN: 0 partidos.');
      }

      if (!matches.length) {
        this.logger.log('📡 [3/4] API-Football...');
        matches = await this.fetchFromApiFootball();
        this.logger.log(matches.length ? `✅ API-Football: ${matches.length} partidos.` : '❌ API-Football: 0 partidos.');
      }

      if (!matches.length) {
        this.logger.log('📡 [4/4] Wikipedia...');
        matches = await this.fetchFromWikipedia();
        this.logger.log(matches.length ? `✅ Wikipedia: ${matches.length} partidos.` : '❌ Wikipedia: 0 partidos.');
      }

      if (!matches.length) {
        this.logger.warn('⚠️ Todas las fuentes fallaron. Usando fixture interno.');
        matches = this.getFallbackFixture();
      }

      const deduped = dedup(matches);
      this.logger.log(
        `📊 Total tras dedup: ${deduped.length} partidos ` +
        `(scheduled: ${deduped.filter(m => m.status === 'scheduled').length}, ` +
        `finished: ${deduped.filter(m => m.status === 'finished').length})`
      );
      await this.saveToDatabase(deduped);
    } catch (error: any) {
      this.logger.error(`❌ Error crítico: ${error?.message}`);
    }
  }

  // ── Descubrimiento TheSportsDB ID ────────────────────────────────────────────

  private async resolveTheSportsDbId(): Promise<string | null> {
    if (this.sportsDbTeamId) return this.sportsDbTeamId;

    try {
      const url = 'https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=River+Plate';
      const res = await axios.get(url, { headers: AXIOS_HEADERS, timeout: 10000 });
      const teams: any[] = res.data?.teams || [];

      this.logger.log(`TheSportsDB búsqueda "River Plate": ${teams.length} resultados`);

      for (const t of teams) {
        const country = (t.strCountry || '').toLowerCase();
        const league  = (t.strLeague  || '').toLowerCase();
        const name    = (t.strTeam    || '').toLowerCase();

        this.logger.log(`  → ${t.strTeam} | País: ${t.strCountry} | Liga: ${t.strLeague} | ID: ${t.idTeam}`);

        const isArgentina =
          country.includes('argentina') ||
          league.includes('primera') ||
          league.includes('argentina');

        if (isArgentina && name.includes('river plate')) {
          this.sportsDbTeamId = t.idTeam;
          this.logger.log(`✅ TheSportsDB ID encontrado: ${this.sportsDbTeamId} (${t.strTeam} - ${t.strCountry})`);
          return this.sportsDbTeamId;
        }
      }

      this.logger.warn('⚠️ TheSportsDB: no se encontró River Plate Argentina.');
    } catch (e: any) {
      this.logger.warn(`⚠️ TheSportsDB discovery falló: ${e?.message}`);
    }

    return null;
  }

  // ── Fuente 1: TheSportsDB ────────────────────────────────────────────────────

  private async fetchFromTheSportsDB(): Promise<any[]> {
    const teamId = await this.resolveTheSportsDbId();
    if (!teamId) {
      this.logger.warn('⚠️ TheSportsDB: no se pudo resolver el team ID.');
      return [];
    }

    const allMatches: any[] = [];

    for (const [endpoint, key] of [
      ['eventsnext.php', 'events'],
      ['eventslast.php', 'results'],
    ] as [string, string][]) {
      try {
        const url = `https://www.thesportsdb.com/api/v1/json/3/${endpoint}?id=${teamId}`;
        const res = await axios.get(url, { headers: AXIOS_HEADERS, timeout: 10000 });
        const events: any[] = res.data?.[key] || [];

        for (const ev of events) {
          const homeTeamRaw  = ev.strHomeTeam || '';
          const awayTeamRaw  = ev.strAwayTeam || '';
          const homeScoreRaw = ev.intHomeScore != null ? parseInt(ev.intHomeScore, 10) : null;
          const awayScoreRaw = ev.intAwayScore != null ? parseInt(ev.intAwayScore, 10) : null;

          const statusRaw = (ev.strStatus || '').toLowerCase();
          let status = 'scheduled';
          if (['match finished', 'ft', 'aet', 'pen', 'finished'].includes(statusRaw)) {
            status = 'finished';
          } else if (statusRaw.includes('live') || statusRaw.includes('progress')) {
            status = 'live';
          } else if (homeScoreRaw !== null && awayScoreRaw !== null) {
            status = 'finished';
          }

          const dateStr = ev.dateEvent || null;
          const timeStr = ev.strTime   || '20:00:00';
          const date    = dateStr
            ? new Date(`${dateStr}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}`)
            : new Date();

          const normalized = normalizeTeams(homeTeamRaw, awayTeamRaw, homeScoreRaw, awayScoreRaw);

          if (!isRiver(normalized.homeTeam) && !isRiver(normalized.awayTeam)) {
            this.logger.warn(`⚠️ Partido descartado (no involucra River): ${homeTeamRaw} vs ${awayTeamRaw}`);
            continue;
          }

          allMatches.push({
            ...normalized,
            status,
            date,
            competition: ev.strLeague || ev.strSeason || 'Competición',
          });
        }
      } catch (e: any) {
        this.logger.warn(`⚠️ TheSportsDB [${endpoint}] falló: ${e?.message}`);
      }
    }

    return allMatches;
  }

  // ── Descubrimiento ESPN team ID ──────────────────────────────────────────────

  private async resolveEspnTeamId(): Promise<string | null> {
    if (this.espnTeamId) return this.espnTeamId;

    try {
      const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/teams?limit=100';
      const res = await axios.get(url, { headers: AXIOS_HEADERS, timeout: 10000 });

      const sportsArr: any[] = res.data?.sports || [];
      let teams: any[] = [];

      if (sportsArr.length > 0) {
        teams = sportsArr[0]?.leagues?.[0]?.teams || [];
      } else {
        teams = res.data?.teams || [];
      }

      this.logger.log(`ESPN equipos en arg.1: ${teams.length}`);

      for (const entry of teams) {
        const t    = entry.team || entry;
        const name = (t.displayName || t.name || '').toLowerCase();
        this.logger.log(`  → ${t.displayName} | ID: ${t.id}`);

        if (name.includes('river plate') || name === 'river') {
          this.espnTeamId = String(t.id);
          this.logger.log(`✅ ESPN team ID encontrado: ${this.espnTeamId} (${t.displayName})`);
          return this.espnTeamId;
        }
      }

      this.logger.warn('⚠️ ESPN: River Plate no encontrado en la lista de arg.1');
    } catch (e: any) {
      this.logger.warn(`⚠️ ESPN discovery falló: ${e?.message}`);
    }

    return null;
  }

  // ── Mapeo de status ESPN unificado ───────────────────────────────────────────

  private mapEspnStatus(statusName: string): 'scheduled' | 'live' | 'finished' {
    const finishedStates = [
      'STATUS_FINAL', 'STATUS_FULL_TIME', 'STATUS_POSTPONED', 'STATUS_CANCELED',
      'STATUS_FINAL_PEN', 'STATUS_FINAL_AET', 'STATUS_FINAL_PEN_AET',
    ];
    const liveStates = ['STATUS_IN_PROGRESS', 'STATUS_HALFTIME', 'STATUS_FIRST_HALF', 'STATUS_SECOND_HALF'];
    if (finishedStates.includes(statusName)) return 'finished';
    if (liveStates.includes(statusName)) return 'live';
    return 'scheduled';
  }

  // Score puede venir como objeto o string en distintos endpoints de ESPN
  private extractScore(scoreField: any): number | null {
    if (scoreField == null) return null;
    if (typeof scoreField === 'number') return scoreField;
    if (typeof scoreField === 'string') {
      const n = parseInt(scoreField, 10);
      return Number.isNaN(n) ? null : n;
    }
    if (typeof scoreField === 'object') {
      const candidate = scoreField.value ?? scoreField.displayValue;
      if (candidate == null) return null;
      const n = parseInt(String(candidate), 10);
      return Number.isNaN(n) ? null : n;
    }
    return null;
  }

  // ── Fuente 2: ESPN JSON API ───────────────────────────────────────────────────

  private async fetchFromEspnApi(): Promise<any[]> {
    const teamId = await this.resolveEspnTeamId();
    if (!teamId) return [];

    const currentYear = new Date().getFullYear();
    const allMatches: any[] = [];

    for (const league of ESPN_LEAGUES) {
      try {
        const eventMap = new Map<string, any>();

        // 1. Schedule por temporada (trae partidos pasados y a veces futuros)
        const seasonsToTry = [currentYear, currentYear - 1, ''] as (number | string)[];
        for (const season of seasonsToTry) {
          try {
            const seasonParam = season !== '' ? `?season=${season}` : '';
            const url =
              `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}` +
              `/teams/${teamId}/schedule${seasonParam}`;

            const res = await axios.get(url, { headers: AXIOS_HEADERS, timeout: 10000 });
            const fetched: any[] = res.data?.events || [];

            for (const ev of fetched) {
              const id = ev.id || `${ev.date}-${league.code}`;
              if (!eventMap.has(id)) eventMap.set(id, ev);
            }
          } catch { /* continuar con siguiente season */ }
        }

        // 2. Próximos eventos del equipo (esto trae el partido más cercano programado)
        try {
          const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/teams/${teamId}`;
          const res = await axios.get(url, { headers: AXIOS_HEADERS, timeout: 10000 });
          const nextEvents: any[] = res.data?.team?.nextEvent || [];
          for (const ev of nextEvents) {
            const id = ev.id || `${ev.date}-${league.code}`;
            if (!eventMap.has(id)) eventMap.set(id, ev);
          }
          if (nextEvents.length) {
            this.logger.log(`ESPN [${league.code}]: +${nextEvents.length} nextEvent(s)`);
          }
        } catch (e: any) {
          this.logger.warn(`⚠️ ESPN nextEvent [${league.code}] falló: ${e?.message}`);
        }

        // Scoreboard reciente para arg.1 (captura partidos de Copa de la Liga no incluidos en schedule)
        if (league.code === 'arg.1') {
          try {
            const today = new Date();
            const from = new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000)
              .toISOString().slice(0, 10).replace(/-/g, '');
            const to = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
              .toISOString().slice(0, 10).replace(/-/g, '');
            const sbUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard?dates=${from}-${to}`;
            const sbRes = await axios.get(sbUrl, { headers: AXIOS_HEADERS, timeout: 10000 });
            for (const ev of sbRes.data?.events ?? []) {
              const id = String(ev.id || `${ev.date}-${league.code}-sb`);
              if (!eventMap.has(id)) eventMap.set(id, ev);
            }
          } catch { /* continuar */ }
        }

        const events = [...eventMap.values()];
        this.logger.log(`ESPN [${league.code}]: ${events.length} eventos totales`);

        for (const event of events) {
          const comp = event.competitions?.[0];
          if (!comp) continue;

          const home = comp.competitors?.find((c: any) => c.homeAway === 'home');
          const away = comp.competitors?.find((c: any) => c.homeAway === 'away');
          if (!home || !away) continue;

          const statusName: string = comp.status?.type?.name || '';
          const status = this.mapEspnStatus(statusName);
          const eventDate = new Date(comp.date || event.date || Date.now());

          const rawHomeScore = status === 'scheduled' ? null : this.extractScore(home.score);
          const rawAwayScore = status === 'scheduled' ? null : this.extractScore(away.score);

          // Detectar ganador por penales: scores iguales pero competitors[].winner = true
          const homeWins: boolean = home?.winner === true;
          const awayWins: boolean = away?.winner === true;
          const tiedScore = rawHomeScore !== null && rawAwayScore !== null && rawHomeScore === rawAwayScore;
          const penaltyWinner = (status === 'finished' && tiedScore && (homeWins || awayWins))
            ? (homeWins ? (home?.team?.displayName || home?.team?.name || '') : (away?.team?.displayName || away?.team?.name || ''))
            : null;

          const normalized = normalizeTeams(
            home.team?.displayName || home.team?.name || '',
            away.team?.displayName || away.team?.name || '',
            rawHomeScore,
            rawAwayScore,
          );

          if (!isRiver(normalized.homeTeam) && !isRiver(normalized.awayTeam)) continue;

          allMatches.push({
            ...normalized,
            status,
            date: eventDate,
            competition: league.name,
            minute: comp.status?.displayClock ? parseInt(comp.status.displayClock, 10) || null : null,
            penaltyWinner,
          });
        }
      } catch (e: any) {
        this.logger.warn(`⚠️ ESPN [${league.code}] falló: ${e?.message}`);
      }
    }

    return allMatches;
  }

  // ── Fuente 3: API-Football v3 ────────────────────────────────────────────────

  private async fetchFromApiFootball(): Promise<any[]> {
    const apiKey = process.env.API_FOOTBALL_KEY;
    const teamId = process.env.RIVER_PLATE_TEAM_ID || '26';

    if (!apiKey) {
      this.logger.warn('⚠️ API_FOOTBALL_KEY no configurada. Saltando.');
      return [];
    }

    try {
      const [nextRes, pastRes] = await Promise.all([
        axios.get(`https://v3.football.api-sports.io/fixtures?team=${teamId}&next=20`, {
          headers: { 'x-apisports-key': apiKey },
          timeout: 10000,
        }),
        axios.get(`https://v3.football.api-sports.io/fixtures?team=${teamId}&last=40`, {
          headers: { 'x-apisports-key': apiKey },
          timeout: 10000,
        }),
      ]);

      const raw = [
        ...(nextRes.data?.response || []),
        ...(pastRes.data?.response  || []),
      ];

      return raw.map((f: any) => {
        const short = f.fixture?.status?.short ?? '';
        let status = 'scheduled';
        if (short === 'FT') status = 'finished';
        else if (['1H', '2H', 'HT', 'LIVE'].includes(short)) status = 'live';

        const date = new Date(f.fixture?.date || Date.now());

        const normalized = normalizeTeams(
          (f.teams?.home?.name || '').toString(),
          (f.teams?.away?.name || '').toString(),
          f.goals?.home ?? null,
          f.goals?.away ?? null,
        );

        return { ...normalized, status, date, competition: f.league?.name || 'Competición' };
      });
    } catch (e: any) {
      this.logger.warn(`⚠️ API-Football falló: ${e?.message}`);
      return [];
    }
  }

  // ── Fuente 4: Wikipedia ──────────────────────────────────────────────────────

  private async fetchFromWikipedia(): Promise<any[]> {
    const currentYear = new Date().getFullYear();
    const pageTitles = [
      `Anexo:Temporada_${currentYear}_del_Club_Atlético_River_Plate`,
      `Club_Atlético_River_Plate_en_${currentYear}`,
    ];
    const allMatches: any[] = [];

    for (const title of pageTitles) {
      try {
        const url =
          `https://es.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content` +
          `&format=json&titles=${encodeURIComponent(title)}&utf8=1`;
        const res = await axios.get(url, { headers: AXIOS_HEADERS, timeout: 10000 });
        const pages   = res.data?.query?.pages || {};
        const pageId  = Object.keys(pages)[0];
        const content = pages[pageId]?.revisions?.[0]?.['*'];
        if (content) allMatches.push(...this.parseWikiContent(content, currentYear));
      } catch (e: any) {
        this.logger.warn(`⚠️ Wikipedia [${title}] falló: ${e?.message}`);
      }
    }

    return allMatches;
  }

  private parseWikiContent(content: string, currentYear: number): any[] {
    const matches: any[] = [];
    const startRegex = /\{\{Ficha de partido/gi;
    let match: RegExpExecArray | null;

    while ((match = startRegex.exec(content)) !== null) {
      let depth = 0;
      const start = match.index;
      let end = start;

      for (let i = start; i < content.length - 1; i++) {
        if (content[i] === '{' && content[i + 1] === '{') { depth++; i++; }
        else if (content[i] === '}' && content[i + 1] === '}') {
          depth--;
          if (depth === 0) { end = i + 2; break; }
          i++;
        }
      }

      if (end <= start) continue;
      const block = content.slice(start, end);

      const getValue = (...keys: string[]) => {
        for (const key of keys) {
          const re = new RegExp(`\\|\\s*${key}\\s*=\\s*([^|\\n\\}]+)`, 'i');
          const m  = block.match(re);
          if (m?.[1]) return m[1].trim().replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1').trim();
        }
        return null;
      };

      const homeRaw  = getValue('local', 'equipo_local', 'home');
      const awayRaw  = getValue('visita', 'visitante', 'away');
      const scoreRaw = getValue('resultado', 'score', 'result');
      const dateRaw  = getValue('fecha', 'date');
      const comp     = getValue('competicion', 'competencia', 'competition', 'torneo') || 'Torneo Oficial';

      if (!homeRaw || !awayRaw) continue;
      if (!isRiver(homeRaw) && !isRiver(awayRaw)) continue;

      let homeScore: number | null = null;
      let awayScore: number | null = null;
      let status = 'scheduled';

      if (scoreRaw) {
        const s  = scoreRaw.replace(/[\u2013\u2014–—]/g, '-').replace(':', '-');
        const sm = s.match(/(\d+)\s*-\s*(\d+)/);
        if (sm) {
          homeScore = parseInt(sm[1], 10);
          awayScore = parseInt(sm[2], 10);
          status = 'finished';
        }
      }

      let date = new Date();
      if (dateRaw) {
        const iso = new Date(dateRaw);
        if (!isNaN(iso.getTime())) {
          date = iso;
        } else {
          const MONTHS: Record<string, number> = {
            enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
            julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
          };
          const parts = dateRaw.split(' de ').map((p: string) => p.trim().toLowerCase());
          const day   = parseInt(parts[0], 10);
          const month = MONTHS[parts[1]] ?? 0;
          const year  = parts[2] ? parseInt(parts[2], 10) : currentYear;
          date = new Date(year, month, isNaN(day) ? 1 : day, 20, 0, 0);
        }
      }

      // Si la fecha ya pasó y no tiene score, marcar como finished igual
      if (status === 'scheduled' && date < new Date()) {
        status = 'finished';
      }

      const normalized = normalizeTeams(homeRaw, awayRaw, homeScore, awayScore);
      matches.push({ ...normalized, status, date, competition: comp });
    }

    return matches;
  }

  // ── Persistencia ─────────────────────────────────────────────────────────────

  private async saveToDatabase(fixtures: any[]) {
    if (!fixtures.length) {
      this.logger.warn('⚠️ No hay partidos para guardar.');
      return;
    }

    fixtures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const now            = new Date();
    let nextAssigned     = false;
    const finished       = fixtures.filter(f => f.status === 'finished');
    const latestFinished = finished[finished.length - 1];

    const records = fixtures.map((m, i) => {
      const status = (m.status || 'scheduled').toLowerCase();

      let type: string;
      if (status === 'live') {
        type = 'LIVE';
      } else if (status === 'finished') {
        type = m === latestFinished ? 'LATEST' : `PAST_${i}`;
      } else {
        if (!nextAssigned && new Date(m.date) > now) {
          type = 'NEXT';
          nextAssigned = true;
        } else {
          type = `FUTURE_${i}`;
        }
      }

      return {
        type,
        homeTeam:      m.homeTeam,
        awayTeam:      m.awayTeam,
        homeScore:     m.homeScore  ?? 0,
        awayScore:     m.awayScore  ?? 0,
        status,
        minute:        status === 'live' ? (m.minute ?? 0) : status === 'finished' ? 90 : 0,
        date:          new Date(m.date),
        competition:   m.competition || 'Competición',
        penaltyWinner: m.penaltyWinner ?? null,
        updatedAt:     new Date(),
      };
    });

    // Si NEXT no se asignó, asignarlo al primer scheduled disponible
    if (!nextAssigned) {
      const firstScheduled = records.find(r => r.status === 'scheduled');
      if (firstScheduled) {
        firstScheduled.type = 'NEXT';
        this.logger.warn('⚠️ NEXT asignado por fallback (partido scheduled con fecha pasada).');
      }
    }

    try {
      // Respetar partidos con manualOverride=true (no los borramos)
      await this.prisma.$transaction([
        this.prisma.match.deleteMany({ where: { manualOverride: false } }),
        this.prisma.match.createMany({ data: records }),
      ]);
      this.logger.log(`🎉 Sincronizados ${fixtures.length} partidos.`);
    } catch (err: any) {
      this.logger.error(`❌ Error guardando en BD: ${err?.message}`);
    }
  }

  // ── Fixture interno de respaldo ───────────────────────────────────────────────

  private getFallbackFixture(): any[] {
    const y = new Date().getFullYear();
    return [
      { homeTeam: RIVER_CANON,    awayTeam: 'Independiente', homeScore: 2,    awayScore: 0,    status: 'finished',  date: new Date(`${y}-04-12T20:00:00`), competition: 'Liga Profesional' },
      { homeTeam: 'Boca Juniors', awayTeam: RIVER_CANON,     homeScore: 1,    awayScore: 1,    status: 'finished',  date: new Date(`${y}-04-19T20:00:00`), competition: 'Liga Profesional' },
      { homeTeam: RIVER_CANON,    awayTeam: 'San Lorenzo',   homeScore: null, awayScore: null, status: 'scheduled', date: new Date(`${y}-05-10T20:00:00`), competition: 'Liga Profesional' },
      { homeTeam: RIVER_CANON,    awayTeam: 'Carabobo FC',   homeScore: null, awayScore: null, status: 'scheduled', date: new Date(`${y}-05-14T19:00:00`), competition: 'Copa Sudamericana' },
      { homeTeam: 'Racing Club',  awayTeam: RIVER_CANON,     homeScore: null, awayScore: null, status: 'scheduled', date: new Date(`${y}-05-17T20:00:00`), competition: 'Liga Profesional' },
    ];
  }
}
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { MatchesService } from './matches/matches.service';
import { PrismaService } from './prisma/prisma.service';

const ESPN_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; RiverAppBot/2.0)' };

export interface ScoringPlay {
  team: string;
  scorer: string;
  minute: string;
  period: number;
  type: 'goal' | 'own-goal' | 'penalty';
}

export interface MatchEventPayload {
  id: string;
  type: string;
  minute: number;
  team: string;
  playerName: string | null;
  playerInName: string | null;
  assistName: string | null;
  detail: string | null;
  period: number;
}

export interface LiveMatchPayload {
  id: string;
  status: 'pre' | 'in' | 'post';
  displayClock: string;
  period: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  competition: string;
  venue: string;
  scoringPlays: ScoringPlay[];
  events: MatchEventPayload[];
}


@Injectable()
export class LiveApiService {
  private readonly logger = new Logger(LiveApiService.name);
  private cache: any = null;
  private lastFetch = 0;

  constructor(
    private readonly matchesService: MatchesService,
    private readonly prisma: PrismaService,
  ) {}

  async getDashboardData() {
    if (this.cache && Date.now() - this.lastFetch < 300_000) {
      return this.cache;
    }

    const [latest, upcomingList, pastList] = await Promise.all([
      this.matchesService.getLatestMatch(),
      this.matchesService.getUpcomingMatches(10),
      this.matchesService.getPastMatches(40),
    ]);

    const nextMatch = upcomingList.find((m) => m.status !== 'finished') ?? null;
    const lastFinished = pastList.find((m) => m.status === 'finished') ?? null;

    // Fetch goal events for the last match
    let lastMatchGoalEvents: any[] = [];
    if (lastFinished) {
      const evts = await this.prisma.matchEvent.findMany({
        where: { matchId: lastFinished.id, type: { in: ['goal', 'own-goal', 'penalty-goal'] } },
        orderBy: { minute: 'asc' },
        select: { playerName: true, minute: true, team: true, type: true },
      });
      lastMatchGoalEvents = evts;
    }
    const lastMatch = lastFinished ? { ...lastFinished, goalEvents: lastMatchGoalEvents } : null;

    const formatMatch = (m: any) => {
      if (!m) return null;
      return {
        id: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        date: m.date,
        status: m.status,
        competition: m.competition,
        minute: m.minute,
        penaltyWinner: m.penaltyWinner ?? null,
        stadium: m.stadium ?? null,
        goalEvents: m.goalEvents ?? [],
      };
    };

    const { table, stats } = await this.fetchStandingsAndStats(pastList);

    this.cache = {
      lastMatch: formatMatch(lastMatch),
      nextMatch: formatMatch(nextMatch),
      currentMatch: formatMatch(latest),
      upcomingMatches: upcomingList.map(formatMatch),
      standings: table,
      stats,
    };
    this.lastFetch = Date.now();
    return this.cache;
  }

  private async fetchStandingsAndStats(pastMatches: any[]) {
    let table: any[] = [];
    let stats = this.computeStatsFromMatches(pastMatches);

    // Calcular goleador de temporada desde la DB
    try {
      const goalEvents = await this.prisma.matchEvent.findMany({
        where: { type: { in: ['goal', 'penalty-goal'] }, playerName: { not: null } },
        select: { playerName: true },
        take: 300,
      });
      const scorerMap = new Map<string, number>();
      for (const e of goalEvents) {
        if (e.playerName) scorerMap.set(e.playerName, (scorerMap.get(e.playerName) ?? 0) + 1);
      }
      const top = [...scorerMap.entries()].sort((a, b) => b[1] - a[1])[0];
      if (top) stats.topScorer = `${top[0]} (${top[1]})`;
    } catch { /* mantener N/A */ }

    try {
      const url = 'https://site.api.espn.com/apis/v2/sports/soccer/arg.1/standings';
      const res = await axios.get(url, { headers: ESPN_HEADERS, timeout: 10000 });

      const entries: any[] = res.data?.children?.[0]?.standings?.entries
        ?? res.data?.standings?.entries
        ?? [];

      table = entries.map((e) => {
        const valueOf = (key: string) => {
          const stat = e.stats?.find((s: any) => s.name === key || s.type === key);
          if (!stat) return 0;
          return typeof stat.value === 'number' ? stat.value : parseInt(stat.displayValue ?? '0', 10);
        };
        return {
          pos: valueOf('rank'),
          team: e.team?.displayName ?? e.team?.name ?? '',
          pts: valueOf('points'),
          pj: valueOf('gamesPlayed'),
          dif: valueOf('pointDifferential'),
        };
      }).sort((a, b) => a.pos - b.pos);

      const riverEntry = entries.find((e) =>
        /river plate/i.test(e.team?.displayName ?? e.team?.name ?? '')
      );
      if (riverEntry) {
        const get = (k: string) => {
          const s = riverEntry.stats?.find((x: any) => x.name === k || x.type === k);
          if (!s) return 0;
          return typeof s.value === 'number' ? s.value : parseInt(s.displayValue ?? '0', 10);
        };
        stats = {
          pj: get('gamesPlayed'),
          pg: get('wins'),
          pe: get('ties'),
          pp: get('losses'),
          gf: get('pointsFor'),
          gc: get('pointsAgainst'),
          streak: stats.streak,
          topScorer: stats.topScorer,
        };
      }
    } catch (e: any) {
      this.logger.warn(`ESPN standings falló: ${e?.message}. Usando stats locales.`);
    }

    return { table, stats };
  }

  private computeStatsFromMatches(past: any[]) {
    const finished = past.filter((m) => m.status === 'finished').slice(0, 38);
    let pg = 0, pe = 0, pp = 0, gf = 0, gc = 0;
    const streakBuf: ('W' | 'D' | 'L')[] = [];

    for (const m of finished) {
      const isHome = /river/i.test(m.homeTeam);
      const our = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
      const them = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
      gf += our;
      gc += them;
      if (our > them) { pg++; streakBuf.push('W'); }
      else if (our === them) { pe++; streakBuf.push('D'); }
      else { pp++; streakBuf.push('L'); }
    }

    return {
      pj: finished.length,
      pg, pe, pp, gf, gc,
      streak: this.parseForm(streakBuf.slice(0, 5).join('')),
      topScorer: 'N/A',
    };
  }

  private parseForm(form: string) {
    if (!form) return '-';
    const w = (form.match(/W/g) || []).length;
    if (w >= 3) return `${w} victorias en ${form.length} PJ`;
    if (form.includes('L')) return 'Irregular';
    return 'Estable';
  }

  // ── Live match (sin caché — se llama cada 30s desde el Gateway) ───────────

  async getLiveMatch(): Promise<LiveMatchPayload | null> {
    const LIVE_LEAGUES = ['arg.1', 'conmebol.libertadores', 'conmebol.sudamericana', 'arg.copa'];

    for (const league of LIVE_LEAGUES) {
      try {
        const res = await axios.get(
          `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard`,
          { headers: ESPN_HEADERS, timeout: 8000 },
        );

        const events: any[] = res.data?.events ?? [];

        const liveEvent = events.find((ev) => {
          const state: string = ev.status?.type?.state ?? '';
          const competitors: any[] = ev.competitions?.[0]?.competitors ?? [];
          const hasRiver = competitors.some((c) =>
            /river plate/i.test(c.team?.displayName ?? ''),
          );
          return hasRiver && state === 'in';
        });

        if (!liveEvent) continue;

        // Found a live River match — fetch summary
        const summary = await axios.get(
          `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${liveEvent.id}`,
          { headers: ESPN_HEADERS, timeout: 8000 },
        );

        const payload = this.parseLiveMatch(liveEvent, summary.data);

        // Auto-persist events to the database
        this.persistEventsForMatch(payload.events).catch((e) =>
          this.logger.warn(`Auto-persist events falló: ${e?.message}`),
        );

        return payload;
      } catch (e: any) {
        if (e?.response?.status !== 404) {
          this.logger.warn(`getLiveMatch [${league}] falló: ${e?.message}`);
        }
        // 404 = no matches in this league today, continue silently
      }
    }

    return null;
  }

  /**
   * Fetch ESPN summary for a finished match and persist all events.
   * Called by MatchesService when a match transitions to "finished".
   */
  async syncEventsForFinishedMatch(matchId: string, espnEventId: string): Promise<void> {
    try {
      const summary = await axios.get(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/summary?event=${espnEventId}`,
        { headers: ESPN_HEADERS, timeout: 8000 },
      );
      const events = this.parseEspnKeyEvents(summary.data);
      if (events.length > 0) {
        await this.persistEventsForMatchById(matchId, events);
        this.logger.log(`📋 ${events.length} eventos sincronizados para partido ${matchId}`);
      }
    } catch (e: any) {
      this.logger.warn(`syncEventsForFinishedMatch falló: ${e?.message}`);
    }
  }

  /** Persist parsed events — finds match by team names in the DB, upserts events */
  private async persistEventsForMatch(events: MatchEventPayload[]): Promise<void> {
    if (events.length === 0) return;

    // Find the live match in the DB
    const liveMatch = await this.prisma.match.findFirst({
      where: { status: 'live' },
      orderBy: { date: 'desc' },
    });
    if (!liveMatch) return;

    await this.persistEventsForMatchById(liveMatch.id, events);
  }

  /** Core upsert: deletes old auto-synced events and inserts fresh ones */
  private async persistEventsForMatchById(matchId: string, events: MatchEventPayload[]): Promise<void> {
    // Delete all existing auto-synced events for this match (IDs starting with 'espn-')
    // We use a full replace strategy: delete all non-manual events, then insert fresh
    const existingCount = await this.prisma.matchEvent.count({ where: { matchId } });

    // Only replace if we have more or equal events (never lose data)
    if (events.length >= existingCount || existingCount === 0) {
      await this.prisma.matchEvent.deleteMany({ where: { matchId } });
      await this.prisma.matchEvent.createMany({
        data: events.map((e) => ({
          matchId,
          type: e.type,
          minute: e.minute,
          team: e.team,
          playerName: e.playerName,
          playerInName: e.playerInName,
          assistName: e.assistName,
          detail: e.detail,
          period: e.period,
        })),
      });
    }
  }

  private parseLiveMatch(event: any, summary: any): LiveMatchPayload {
    const comp = event.competitions?.[0] ?? {};
    const competitors: any[] = comp.competitors ?? [];
    const home = competitors.find((c) => c.homeAway === 'home') ?? competitors[0] ?? {};
    const away = competitors.find((c) => c.homeAway === 'away') ?? competitors[1] ?? {};

    const scoringPlays: ScoringPlay[] = (summary.scoringPlays ?? []).map((sp: any) => {
      const typeText: string = (sp.type?.text ?? '').toLowerCase();
      const type: ScoringPlay['type'] =
        typeText.includes('own') ? 'own-goal' :
        typeText.includes('penalty') ? 'penalty' :
        'goal';

      return {
        team: sp.team?.displayName ?? '',
        scorer: sp.participants?.[0]?.athlete?.displayName ?? sp.text ?? '',
        minute: sp.clock?.displayValue ?? '',
        period: sp.period?.number ?? 1,
        type,
      };
    });

    const events = this.parseEspnKeyEvents(summary);

    return {
      id: event.id,
      status: event.status?.type?.state ?? 'in',
      displayClock: event.status?.displayClock ?? '',
      period: event.status?.period ?? 1,
      homeTeam: home.team?.displayName ?? '',
      awayTeam: away.team?.displayName ?? '',
      homeScore: parseInt(home.score ?? '0', 10),
      awayScore: parseInt(away.score ?? '0', 10),
      competition: event.competitions?.[0]?.type?.text ?? event.name ?? '',
      venue: comp.venue?.fullName ?? '',
      scoringPlays,
      events,
    };
  }

  private parseEspnKeyEvents(summary: any): MatchEventPayload[] {
    const events: MatchEventPayload[] = [];
    const keyEvents: any[] = summary.keyEvents ?? [];

    // Track goals already captured from scoringPlays to avoid duplicates
    const goalKeys = new Set<string>();

    // Goals from scoringPlays (preferred source)
    for (const sp of (summary.scoringPlays ?? [])) {
      const typeText: string = (sp.type?.text ?? '').toLowerCase();
      let type = 'goal';
      if (typeText.includes('own')) type = 'own-goal';
      else if (typeText.includes('penalty')) type = 'penalty-goal';

      const minuteStr = sp.clock?.displayValue ?? '0';
      const minute = parseInt(minuteStr.replace("'", ''), 10) || 0;
      const team = sp.team?.displayName ?? '';
      const player = sp.participants?.[0]?.athlete?.displayName ?? sp.text ?? null;

      goalKeys.add(`${minute}-${team}`);

      events.push({
        id: `espn-goal-${minute}-${team}`,
        type, minute, team,
        playerName: player,
        playerInName: null,
        assistName: sp.participants?.[1]?.athlete?.displayName ?? null,
        detail: null,
        period: sp.period?.number ?? 1,
      });
    }

    for (const ke of keyEvents) {
      const typeText: string = (ke.type?.text ?? ke.text ?? '').toLowerCase();
      const clock = ke.clock?.displayValue ?? ke.time?.displayValue ?? '0';
      const minute = parseInt(clock.replace("'", ''), 10) || 0;
      const team = ke.team?.displayName ?? '';
      const player = ke.participants?.[0]?.athlete?.displayName ?? null;
      const period = ke.period?.number ?? 1;

      // Goals in keyEvents (dedup with scoringPlays)
      const isGoalEvent =
        typeText === 'goal' || typeText === 'gol' ||
        typeText.includes('header goal') ||
        typeText.includes('goal scored') ||
        typeText.includes('gol de');
      const isPenGoal = typeText.includes('penalty goal') || typeText.includes('penal convertido');
      const isOwnGoal = typeText.includes('own goal') || typeText.includes('gol en contra') || typeText.includes('autogoal');

      if (isGoalEvent || isPenGoal || isOwnGoal) {
        const key = `${minute}-${team}`;
        if (!goalKeys.has(key)) {
          goalKeys.add(key);
          events.push({
            id: `espn-ke-goal-${minute}-${team}`,
            type: isOwnGoal ? 'own-goal' : isPenGoal ? 'penalty-goal' : 'goal',
            minute, team, playerName: player, playerInName: null,
            assistName: ke.participants?.[1]?.athlete?.displayName ?? null,
            detail: null, period,
          });
        }
        continue;
      }

      if (typeText.includes('yellow card') || typeText.includes('tarjeta amarilla')) {
        events.push({
          id: `espn-yc-${minute}-${player ?? ''}`, type: 'yellow-card',
          minute, team, playerName: player, playerInName: null, assistName: null, detail: null, period,
        });
      } else if (typeText.includes('red card') || typeText.includes('tarjeta roja')) {
        events.push({
          id: `espn-rc-${minute}-${player ?? ''}`, type: 'red-card',
          minute, team, playerName: player, playerInName: null, assistName: null, detail: null, period,
        });
      } else if (typeText.includes('substitution') || typeText.includes('sustituci')) {
        events.push({
          id: `espn-sub-${minute}-${player ?? ''}`, type: 'substitution',
          minute, team, playerName: player,
          playerInName: ke.participants?.[1]?.athlete?.displayName ?? null,
          assistName: null, detail: null, period,
        });
      } else if (typeText.includes('var') || typeText.includes('video review')) {
        events.push({
          id: `espn-var-${minute}`, type: 'var',
          minute, team, playerName: player, playerInName: null, assistName: null,
          detail: ke.text ?? null, period,
        });
      }
    }

    events.sort((a, b) => a.period - b.period || a.minute - b.minute);
    return events;
  }
}

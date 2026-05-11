import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { MatchesService } from './matches/matches.service';

const ESPN_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; RiverAppBot/2.0)' };

export interface ScoringPlay {
  team: string;
  scorer: string;
  minute: string;
  period: number;
  type: 'goal' | 'own-goal' | 'penalty';
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
}

@Injectable()
export class LiveApiService {
  private readonly logger = new Logger(LiveApiService.name);
  private cache: any = null;
  private lastFetch = 0;

  constructor(private readonly matchesService: MatchesService) {}

  async getDashboardData() {
    if (this.cache && Date.now() - this.lastFetch < 900_000) {
      return this.cache;
    }

    const [latest, upcomingList, pastList] = await Promise.all([
      this.matchesService.getLatestMatch(),
      this.matchesService.getUpcomingMatches(10),
      this.matchesService.getPastMatches(40),
    ]);

    const nextMatch = upcomingList.find((m) => m.status !== 'finished') ?? null;
    const lastFinished = pastList.find((m) => m.status === 'finished') ?? null;
    const lastMatch = lastFinished;

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
    try {
      const res = await axios.get(
        'https://site.api.espn.com/apis/v2/sports/soccer/arg.1/scoreboard',
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

      if (!liveEvent) return null;

      const summary = await axios.get(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/summary?event=${liveEvent.id}`,
        { headers: ESPN_HEADERS, timeout: 8000 },
      );

      return this.parseLiveMatch(liveEvent, summary.data);
    } catch (e: any) {
      this.logger.warn(`getLiveMatch falló: ${e?.message}`);
      return null;
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
    };
  }
}

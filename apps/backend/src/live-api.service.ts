import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { MatchesService } from './matches/matches.service';

const ESPN_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; RiverAppBot/2.0)' };

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

    // 1. Próximo partido y último resultado: leemos de la BD que ya está sincronizada
    const [latest, upcomingList, pastList] = await Promise.all([
      this.matchesService.getLatestMatch(),
      this.matchesService.getUpcomingMatches(10),
      this.matchesService.getPastMatches(40),
    ]);

    const nextMatch = upcomingList.find((m) => m.status !== 'finished') ?? null;
    const lastFinished = pastList.find((m) => m.status === 'finished') ?? null;
    // El "lastMatch" del home es el último jugado; "latest" puede ser el live/próximo
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

    // 2. Tabla de posiciones + stats: ESPN
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

  /**
   * Tabla de posiciones de la Liga Profesional Argentina desde ESPN.
   * Si falla, computa stats desde los partidos pasados de River en la BD.
   */
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
      this.logger.warn(`⚠️ ESPN standings falló: ${e?.message}. Usando stats locales.`);
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
}

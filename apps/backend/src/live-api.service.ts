import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LiveApiService {
  private readonly logger = new Logger(LiveApiService.name);
  private cache: any = null;
  private lastFetch: number = 0;

  async getDashboardData() {
    // Retornamos caché si tiene menos de 15 minutos para no saturar la API gratuita
    if (this.cache && Date.now() - this.lastFetch < 900000) {
      return this.cache;
    }

    const apiKey = process.env.API_FOOTBALL_KEY;
    const teamId = process.env.RIVER_PLATE_TEAM_ID || '435';
    const currentYear = new Date().getFullYear();

    if (!apiKey) throw new Error('API_FOOTBALL_KEY no configurada.');

    try {
      this.logger.log('🌐 Extrayendo datos 100% reales desde API-Football (LiveApi)...');
      const headers = { 'x-apisports-key': apiKey };

      // 1. Buscamos partidos
      const [lastRes, nextRes] = await Promise.all([
        axios.get(`https://v3.football.api-sports.io/fixtures?team=${teamId}&last=1`, { headers }),
        axios.get(`https://v3.football.api-sports.io/fixtures?team=${teamId}&next=10`, { headers })
      ]);

      const lastMatch = lastRes.data.response?.[0];
      const upcoming = nextRes.data.response || [];
      const nextMatch = upcoming[0];

      const formatMatch = (m: any) => {
        if (!m) return null;
        const short = m.fixture.status.short;
        let status = 'scheduled';
        if (['FT', 'AET', 'PEN'].includes(short)) status = 'finished';
        else if (['1H', '2H', 'HT', 'LIVE'].includes(short)) status = 'live';

        return {
          id: m.fixture.id,
          homeTeam: m.teams.home.name,
          awayTeam: m.teams.away.name,
          homeScore: m.goals.home,
          awayScore: m.goals.away,
          date: m.fixture.date,
          status,
          competition: m.league.name,
          minute: m.fixture.status.elapsed
        };
      };

      // 2. Buscamos Tabla de Posiciones
      let standingsRes = await axios.get(`https://v3.football.api-sports.io/standings?season=${currentYear}&team=${teamId}`, { headers });
      if (!standingsRes.data.response?.length) {
        standingsRes = await axios.get(`https://v3.football.api-sports.io/standings?season=${currentYear - 1}&team=${teamId}`, { headers });
      }

      let table = [];
      let stats = { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, streak: '-', topScorer: 'N/A' };

      if (standingsRes.data.response?.length > 0) {
        const league = standingsRes.data.response[0].league;
        const allStandings = league.standings[0];

        table = allStandings.map((row: any) => ({
          pos: row.rank,
          team: row.team.name,
          pts: row.points,
          pj: row.all.played,
          dif: row.goalsDiff
        }));

        const riverRow = allStandings.find((r: any) => String(r.team.id) === String(teamId));
        if (riverRow) {
          stats = {
            pj: riverRow.all.played,
            pg: riverRow.all.win,
            pe: riverRow.all.draw,
            pp: riverRow.all.lose,
            gf: riverRow.all.goals.for,
            gc: riverRow.all.goals.against,
            streak: this.parseForm(riverRow.form),
            topScorer: 'N/A'
          };
        }
      }

      this.cache = {
        lastMatch: formatMatch(lastMatch),
        nextMatch: formatMatch(nextMatch),
        upcomingMatches: upcoming.map(formatMatch),
        standings: table,
        stats
      };
      this.lastFetch = Date.now();
      return this.cache;
    } catch (e: any) {
      this.logger.error('Error Live API: ' + e.message);
      if (this.cache) return this.cache;
      throw e;
    }
  }

  private parseForm(form: string) {
    if (!form) return 'N/A';
    const l = form.slice(-5);
    const w = (l.match(/W/g) || []).length;
    if (w >= 3) return `${w} victorias en 5 PJ`;
    if (l.includes('L')) return 'Irregular';
    return 'Estable';
  }
}
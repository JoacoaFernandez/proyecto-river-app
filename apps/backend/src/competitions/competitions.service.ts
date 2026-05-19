// apps/backend/src/competitions/competitions.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import axios from 'axios';

const ESPN_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; RiverAppBot/2.0)' };

export interface CompetitionMeta {
  code: string;
  name: string;
  shortName: string;
  type: 'league' | 'cup';
  country: string;
  /** En las copas internacionales tipo Libertadores no hay tabla unificada */
  hasStandings: boolean;
}

export const COMPETITIONS: CompetitionMeta[] = [
  {
    code: 'arg.1',
    name: 'Liga Profesional Argentina',
    shortName: 'Liga Argentina',
    type: 'league',
    country: 'Argentina',
    hasStandings: true,
  },
  {
    code: 'conmebol.libertadores',
    name: 'Copa Libertadores',
    shortName: 'Libertadores',
    type: 'cup',
    country: 'Sudamérica',
    hasStandings: true,
  },
  {
    code: 'conmebol.sudamericana',
    name: 'Copa Sudamericana',
    shortName: 'Sudamericana',
    type: 'cup',
    country: 'Sudamérica',
    hasStandings: true,
  },
];

export interface StandingRow {
  pos: number;
  team: string;
  teamLogo: string | null;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dif: number;
  pts: number;
  trend?: 'up' | 'down' | 'same';
}

export interface StandingsGroup {
  /** Nombre normalizado, p.ej. "Zona A" / "Zona B" */
  name: string;
  /** Identificador corto: "A" / "B" / etc. */
  key: string;
  standings: StandingRow[];
}

export interface PlayoffSeed {
  team: string;
  teamLogo: string | null;
  /** Etiqueta del cruce: "A1", "B8", etc. Vacío para slots derivados (ganador de O1, etc.) */
  seed: string;
}

export type PlayoffRound = 'octavos' | 'cuartos' | 'semis' | 'final';
export type PlayoffStatus = 'pending' | 'scheduled' | 'live' | 'finished';

export interface PlayoffMatch {
  round: PlayoffRound;
  /** Posición visual en el bracket */
  slot: number;
  home: PlayoffSeed | null;
  away: PlayoffSeed | null;
  homeScore: number | null;
  awayScore: number | null;
  homePenScore: number | null;
  awayPenScore: number | null;
  status: PlayoffStatus;
  date: string | null;
  winner: 'home' | 'away' | null;
  penaltyDecided: boolean;
  /** Cuando la llave es a doble partido, contiene cada leg en orden cronológico. */
  legs?: PlayoffLeg[];
}

export interface PlayoffLeg {
  leg: 1 | 2;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: PlayoffStatus;
  date: string | null;
}

export interface PlayoffsBracket {
  format: string;
  rounds: {
    octavos: PlayoffMatch[];
    cuartos: PlayoffMatch[];
    semis: PlayoffMatch[];
    final: PlayoffMatch[];
  };
}

export interface StandingsResponse {
  meta: CompetitionMeta;
  /** Liga arg.1 viene con 2 zonas; otras ligas pueden venir con una sola */
  groups: StandingsGroup[];
  /** Sólo se calcula para ligas con formato playoff y 2 zonas */
  playoffs: PlayoffsBracket | null;
  /** ISO timestamp de la última actualización de la tabla */
  lastUpdated: string;
}

interface EspnPlayoffMatch {
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  penaltyWinner: string | null;
  homePenScore: number | null;
  awayPenScore: number | null;
  status: PlayoffStatus;
  date: string;
  round: PlayoffRound | null;
}

@Injectable()
export class CompetitionsService {
  private readonly logger = new Logger(CompetitionsService.name);
  private standingsCache = new Map<string, { data: StandingsGroup[]; prev: StandingsGroup[] | null; ts: number }>();
  private playoffsCache = new Map<string, { data: EspnPlayoffMatch[]; ts: number }>();
  private readonly TTL = 15 * 60 * 1000;

  list(): CompetitionMeta[] {
    return COMPETITIONS;
  }

  findByCode(code: string): CompetitionMeta {
    const meta = COMPETITIONS.find((c) => c.code === code);
    if (!meta) {
      throw new NotFoundException(`Competición desconocida: ${code}`);
    }
    return meta;
  }

  async getStandings(code: string): Promise<StandingsResponse> {
    const meta = this.findByCode(code);

    if (!meta.hasStandings) {
      return { meta, groups: [], playoffs: null, lastUpdated: new Date().toISOString() };
    }

    const cached = this.standingsCache.get(code);
    let groups: StandingsGroup[];
    let cacheTs: number;

    if (cached && Date.now() - cached.ts < this.TTL) {
      groups = cached.data;
      cacheTs = cached.ts;
    } else {
      const fresh = await this.fetchGroups(code, cached?.data);
      if (fresh.length > 0) {
        this.applyTrends(fresh, cached?.data ?? null);
        const prev = cached?.data ?? null;
        cacheTs = Date.now();
        this.standingsCache.set(code, { data: fresh, prev, ts: cacheTs });
        groups = fresh;
      } else {
        groups = cached?.data ?? [];
        cacheTs = cached?.ts ?? Date.now();
      }
    }

    let playoffs: PlayoffsBracket | null = null;
    if (code === 'arg.1') {
      playoffs = await this.buildPlayoffsBracket(code, groups);
    } else if (code === 'conmebol.libertadores' || code === 'conmebol.sudamericana') {
      playoffs = await this.buildCopaBracket(code);
    }
    return { meta, groups, playoffs, lastUpdated: new Date(cacheTs).toISOString() };
  }

  private applyTrends(newGroups: StandingsGroup[], oldGroups: StandingsGroup[] | null): void {
    if (!oldGroups) {
      for (const g of newGroups) {
        for (const row of g.standings) row.trend = 'same';
      }
      return;
    }
    for (const newGroup of newGroups) {
      const oldGroup = oldGroups.find((g) => g.key === newGroup.key);
      for (const row of newGroup.standings) {
        const oldRow = oldGroup?.standings.find((r) => this.normalize(r.team) === this.normalize(row.team));
        if (!oldRow) { row.trend = 'same'; continue; }
        if (row.pos < oldRow.pos) row.trend = 'up';
        else if (row.pos > oldRow.pos) row.trend = 'down';
        else row.trend = 'same';
      }
    }
  }

  private async fetchGroups(code: string, fallback?: StandingsGroup[]): Promise<StandingsGroup[]> {
    try {
      const url = `https://site.api.espn.com/apis/v2/sports/soccer/${code}/standings`;
      const res = await axios.get(url, { headers: ESPN_HEADERS, timeout: 10000 });

      const children: any[] = Array.isArray(res.data?.children) ? res.data.children : [];

      if (children.length > 0) {
        return children
          .map((child, idx) => this.parseGroup(child, idx))
          .filter((g) => g.standings.length > 0);
      }

      const entries: any[] = res.data?.standings?.entries ?? [];
      if (entries.length > 0) {
        return [
          {
            name: res.data?.name ?? 'Tabla',
            key: 'main',
            standings: this.parseEntries(entries),
          },
        ];
      }

      return fallback ?? [];
    } catch (e: any) {
      this.logger.warn(`⚠️ ESPN standings [${code}] falló: ${e?.message}`);
      return fallback ?? [];
    }
  }

  private parseGroup(child: any, idx: number): StandingsGroup {
    const entries: any[] = child?.standings?.entries ?? [];
    const standings = this.parseEntries(entries);
    const { name, key } = this.normalizeGroupLabel(child, idx);
    return { name, key, standings };
  }

  private normalizeGroupLabel(child: any, idx: number): { name: string; key: string } {
    const raw: string = child?.name ?? child?.abbreviation ?? '';
    const matchGroup = raw.match(/Group\s+([A-Z0-9]+)/i);
    if (matchGroup) {
      const letter = matchGroup[1].toUpperCase();
      return { name: `Grupo ${letter}`, key: letter };
    }
    const matchZona = raw.match(/Zona\s+([A-Z0-9]+)/i);
    if (matchZona) {
      const letter = matchZona[1].toUpperCase();
      return { name: `Zona ${letter}`, key: letter };
    }
    const fallbackKey = String.fromCharCode('A'.charCodeAt(0) + idx);
    return { name: `Zona ${fallbackKey}`, key: fallbackKey };
  }

  private parseEntries(entries: any[]): StandingRow[] {
    return entries
      .map((e) => {
        const get = (key: string) => {
          const stat = e.stats?.find((s: any) => s.name === key || s.type === key);
          if (!stat) return 0;
          return typeof stat.value === 'number' ? stat.value : parseInt(stat.displayValue ?? '0', 10);
        };
        return {
          pos: get('rank'),
          team: e.team?.displayName ?? e.team?.name ?? 'Desconocido',
          teamLogo: e.team?.logos?.[0]?.href ?? null,
          pj: get('gamesPlayed'),
          pg: get('wins'),
          pe: get('ties'),
          pp: get('losses'),
          gf: get('pointsFor'),
          gc: get('pointsAgainst'),
          dif: get('pointDifferential'),
          pts: get('points'),
        };
      })
      .filter((row) => row.team)
      .sort((a, b) => a.pos - b.pos);
  }

  /**
   * Trae los partidos de playoff directamente desde ESPN scoreboard.
   * El campo `season.type.name` indica la ronda ("Round of 16", "Quarterfinals", etc.)
   * y nos sirve como fuente de verdad para mapear cada partido a su slot del bracket.
   */
  private async fetchPlayoffMatches(code: string): Promise<EspnPlayoffMatch[]> {
    const cached = this.playoffsCache.get(code);
    if (cached && Date.now() - cached.ts < this.TTL) {
      return cached.data;
    }

    try {
      const year = new Date().getUTCFullYear();
      const from = `${year}0501`;
      // Copa Libertadores/Sudamericana finales llegan hasta noviembre
      const to = code === 'arg.1' ? `${year}0831` : `${year}1231`;
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${code}/scoreboard?dates=${from}-${to}`;
      const res = await axios.get(url, { headers: ESPN_HEADERS, timeout: 10000 });

      const events: any[] = Array.isArray(res.data?.events) ? res.data.events : [];
      const matches: EspnPlayoffMatch[] = [];

      for (const ev of events) {
        const seasonSlug: string = ev?.season?.slug ?? '';
        const round = this.parseRoundFromSeason(seasonSlug);
        if (!round) continue;

        const comp = ev?.competitions?.[0];
        const competitors = comp?.competitors ?? [];
        const home = competitors.find((c: any) => c.homeAway === 'home');
        const away = competitors.find((c: any) => c.homeAway === 'away');
        if (!home || !away) continue;

        const statusName: string = ev?.status?.type?.name ?? '';
        const completed: boolean = !!ev?.status?.type?.completed;
        const status = this.mapStatus(statusName, completed);

        const homeScoreRaw = home.score;
        const awayScoreRaw = away.score;
        const hasScore = status === 'finished' || status === 'live';
        const homeScore = hasScore ? this.parseScore(homeScoreRaw) : null;
        const awayScore = hasScore ? this.parseScore(awayScoreRaw) : null;

        // Detectar ganador por penales: scores iguales pero competitors[].winner = true
        const homeWins: boolean = home?.winner === true;
        const awayWins: boolean = away?.winner === true;
        const tiedScore = homeScore !== null && awayScore !== null && homeScore === awayScore;
        const penaltyWinner = (status === 'finished' && tiedScore && (homeWins || awayWins))
          ? (homeWins ? (home?.team?.displayName ?? '') : (away?.team?.displayName ?? ''))
          : null;

        // Intentar extraer score de penales
        let homePenScore: number | null = null;
        let awayPenScore: number | null = null;
        if (penaltyWinner) {
          // 1. Desde competitors[].statistics (stat name = 'penalties' o 'pk')
          const penStatNames = ['penalties', 'pk', 'penaltygoals', 'penalty kicks'];
          const hps = home?.statistics?.find((s: any) => penStatNames.includes((s.name ?? '').toLowerCase()));
          const aps = away?.statistics?.find((s: any) => penStatNames.includes((s.name ?? '').toLowerCase()));
          if (hps != null || aps != null) {
            homePenScore = hps != null ? Number(hps.value ?? hps.displayValue ?? null) : null;
            awayPenScore = aps != null ? Number(aps.value ?? aps.displayValue ?? null) : null;
          }
          // 2. Desde notes/headline: e.g. "(3-1)" o "3-1 en penales"
          if (homePenScore == null) {
            const notes: any[] = comp?.notes ?? [];
            for (const note of notes) {
              const m = (note.headline ?? note.text ?? '').match(/\((\d+)[–\-](\d+)\)|(\d+)[–\-](\d+)\s*(?:pen|pk)/i);
              if (m) {
                const a = parseInt(m[1] ?? m[3]);
                const b = parseInt(m[2] ?? m[4]);
                homePenScore = homeWins ? Math.max(a, b) : Math.min(a, b);
                awayPenScore = awayWins ? Math.max(a, b) : Math.min(a, b);
                break;
              }
            }
          }
        }

        matches.push({
          homeTeam: home?.team?.displayName ?? '',
          awayTeam: away?.team?.displayName ?? '',
          homeScore,
          awayScore,
          penaltyWinner,
          homePenScore,
          awayPenScore,
          status,
          date: ev?.date ?? '',
          round,
        });
      }

      this.playoffsCache.set(code, { data: matches, ts: Date.now() });
      return matches;
    } catch (e: any) {
      this.logger.warn(`⚠️ ESPN scoreboard playoffs [${code}] falló: ${e?.message}`);
      return cached?.data ?? [];
    }
  }

  /**
   * El `season.slug` de ESPN identifica la ronda. Ejemplos observados:
   *   - "torneo-apertura"           → fase regular (no es playoff)
   *   - "apertura---round-of-16"    → octavos
   *   - "apertura---quarterfinals"  → cuartos
   *   - "apertura---semifinals"     → semis
   *   - "apertura---final"          → final
   */
  private parseRoundFromSeason(slug: string): PlayoffRound | null {
    const s = (slug || '').toLowerCase();
    if (s.includes('round-of-16') || s.includes('octavos') || s.includes('knockout-round-playoff')) return 'octavos';
    if (s.includes('quarter')) return 'cuartos';
    if (s.includes('semi')) return 'semis';
    // "final" sólo si NO es quarter/semi y NO es la fase regular
    if (s.includes('final') && !s.includes('apertura-final-stage')) return 'final';
    return null;
  }

  private mapStatus(statusName: string, completed: boolean): PlayoffStatus {
    const s = statusName.toUpperCase();
    const finishedNames = ['STATUS_FINAL', 'STATUS_FULL_TIME', 'STATUS_FINAL_PEN', 'STATUS_FINAL_AET', 'STATUS_FINAL_PEN_AET'];
    if (completed || finishedNames.includes(s)) return 'finished';
    if (
      s === 'STATUS_IN_PROGRESS' ||
      s === 'STATUS_HALFTIME' ||
      s === 'STATUS_FIRST_HALF' ||
      s === 'STATUS_SECOND_HALF'
    ) {
      return 'live';
    }
    if (s === 'STATUS_SCHEDULED') return 'scheduled';
    return 'pending';
  }

  private parseScore(raw: any): number | null {
    if (raw == null) return null;
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'string') {
      const n = parseInt(raw, 10);
      return Number.isNaN(n) ? null : n;
    }
    if (typeof raw === 'object') {
      if (typeof raw.value === 'number') return raw.value;
      if (typeof raw.displayValue === 'string') {
        const n = parseInt(raw.displayValue, 10);
        return Number.isNaN(n) ? null : n;
      }
    }
    return null;
  }

  /**
   * Construye el bracket completo (octavos → cuartos → semis → final) para Liga Profesional Argentina.
   *
   * Cruces inter-zona en octavos:
   *   1: A1 vs B8       2: A4 vs B5       3: A2 vs B7       4: A3 vs B6
   *   5: B1 vs A8       6: B4 vs A5       7: B2 vs A7       8: B3 vs A6
   *
   * Avance a cuartos:   QF1: O1 vs O2     QF2: O3 vs O4     QF3: O5 vs O6     QF4: O7 vs O8
   * Avance a semis:     SF1: QF1 vs QF2   SF2: QF3 vs QF4
   * Final:              F:   SF1 vs SF2
   *
   * Para cada slot tratamos de matchear contra ESPN scoreboard filtrando por la ronda
   * que indica `season.type.name`. Si encontramos el partido, atamos los goles
   * y, si está finalizado, calculamos el ganador y lo proyectamos a la siguiente ronda.
   */
  private async buildPlayoffsBracket(
    code: string,
    groups: StandingsGroup[],
  ): Promise<PlayoffsBracket | null> {
    const zonaA = groups.find((g) => g.key === 'A');
    const zonaB = groups.find((g) => g.key === 'B');
    if (!zonaA || !zonaB) return null;
    if (zonaA.standings.length < 8 || zonaB.standings.length < 8) return null;

    const playoffMatches = await this.fetchPlayoffMatches(code);

    const seedFromZone = (group: StandingsGroup, pos: number): PlayoffSeed | null => {
      const row = group.standings[pos - 1];
      if (!row) return null;
      return { team: row.team, teamLogo: row.teamLogo, seed: `${group.key}${pos}` };
    };

    const buildMatch = (
      round: PlayoffRound,
      slot: number,
      home: PlayoffSeed | null,
      away: PlayoffSeed | null,
    ): PlayoffMatch => {
      const espnMatch =
        home && away ? this.findEspnMatch(home.team, away.team, round, playoffMatches) : null;

      if (!espnMatch) {
        return {
          round,
          slot,
          home,
          away,
          homeScore: null,
          awayScore: null,
          homePenScore: null,
          awayPenScore: null,
          status: 'pending',
          date: null,
          winner: null,
          penaltyDecided: false,
        };
      }

      const flipped = this.normalize(espnMatch.homeTeam) !== this.normalize(home!.team);
      const homeScore = flipped ? espnMatch.awayScore : espnMatch.homeScore;
      const awayScore = flipped ? espnMatch.homeScore : espnMatch.awayScore;
      const homePenScore = flipped ? espnMatch.awayPenScore : espnMatch.homePenScore;
      const awayPenScore = flipped ? espnMatch.homePenScore : espnMatch.awayPenScore;

      let winner: 'home' | 'away' | null = null;
      if (espnMatch.status === 'finished' && homeScore != null && awayScore != null) {
        if (homeScore > awayScore) {
          winner = 'home';
        } else if (awayScore > homeScore) {
          winner = 'away';
        } else if (espnMatch.penaltyWinner) {
          const penNorm = this.normalize(espnMatch.penaltyWinner);
          const homeNorm = this.normalize(home!.team);
          winner = penNorm === homeNorm ? 'home' : 'away';
        }
      }

      return {
        round,
        slot,
        home,
        away,
        homeScore: homeScore ?? null,
        awayScore: awayScore ?? null,
        homePenScore: homePenScore ?? null,
        awayPenScore: awayPenScore ?? null,
        status: espnMatch.status,
        date: espnMatch.date || null,
        winner,
        penaltyDecided: winner !== null && homeScore === awayScore,
      };
    };

    const winnerSeed = (m: PlayoffMatch | undefined): PlayoffSeed | null => {
      if (!m || !m.winner) return null;
      return m.winner === 'home' ? m.home : m.away;
    };

    // Octavos — orden oficial AFA / promiedos
    // Las parejas son cruces inter-zona; lo que cambia es la ubicación visual,
    // que determina cómo se conectan los ganadores con cuartos/semis/final.
    const octavos: PlayoffMatch[] = [
      buildMatch('octavos', 1, seedFromZone(zonaA, 1), seedFromZone(zonaB, 8)), // A1 vs B8
      buildMatch('octavos', 2, seedFromZone(zonaB, 4), seedFromZone(zonaA, 5)), // B4 vs A5
      buildMatch('octavos', 3, seedFromZone(zonaB, 2), seedFromZone(zonaA, 7)), // B2 vs A7  (River)
      buildMatch('octavos', 4, seedFromZone(zonaA, 3), seedFromZone(zonaB, 6)), // A3 vs B6
      buildMatch('octavos', 5, seedFromZone(zonaB, 1), seedFromZone(zonaA, 8)), // B1 vs A8
      buildMatch('octavos', 6, seedFromZone(zonaA, 4), seedFromZone(zonaB, 5)), // A4 vs B5
      buildMatch('octavos', 7, seedFromZone(zonaA, 2), seedFromZone(zonaB, 7)), // A2 vs B7
      buildMatch('octavos', 8, seedFromZone(zonaB, 3), seedFromZone(zonaA, 6)), // B3 vs A6
    ];

    // Cuartos: O1∪O2, O3∪O4, O5∪O6, O7∪O8
    const cuartos: PlayoffMatch[] = [
      buildMatch('cuartos', 1, winnerSeed(octavos[0]), winnerSeed(octavos[1])),
      buildMatch('cuartos', 2, winnerSeed(octavos[2]), winnerSeed(octavos[3])),
      buildMatch('cuartos', 3, winnerSeed(octavos[4]), winnerSeed(octavos[5])),
      buildMatch('cuartos', 4, winnerSeed(octavos[6]), winnerSeed(octavos[7])),
    ];

    // Semis: QF1∪QF2, QF3∪QF4
    const semis: PlayoffMatch[] = [
      buildMatch('semis', 1, winnerSeed(cuartos[0]), winnerSeed(cuartos[1])),
      buildMatch('semis', 2, winnerSeed(cuartos[2]), winnerSeed(cuartos[3])),
    ];

    // Final: SF1∪SF2
    const final: PlayoffMatch[] = [
      buildMatch('final', 1, winnerSeed(semis[0]), winnerSeed(semis[1])),
    ];

    return {
      format: 'Octavos a partido único · cruces inter-zona (Top 8 de cada Zona)',
      rounds: { octavos, cuartos, semis, final },
    };
  }

  private findEspnMatch(
    teamA: string,
    teamB: string,
    round: PlayoffRound,
    matches: EspnPlayoffMatch[],
  ): EspnPlayoffMatch | null {
    const a = this.normalize(teamA);
    const b = this.normalize(teamB);
    return (
      matches.find((m) => {
        if (m.round !== round) return false;
        const home = this.normalize(m.homeTeam);
        const away = this.normalize(m.awayTeam);
        return (home === a && away === b) || (home === b && away === a);
      }) ?? null
    );
  }

  private normalize(s: string): string {
    return (s || '').toLowerCase().trim();
  }

  /**
   * Bracket de eliminatorias para Copa Libertadores / Copa Sudamericana.
   * Intenta poblar los cruces desde ESPN scoreboard; si aún estamos en fase
   * de grupos, todos los slots aparecen como "A confirmar" (pending).
   * Los partidos son a doble partido (ida y vuelta); se muestra marcador agregado.
   */
  private async buildCopaBracket(code: string): Promise<PlayoffsBracket | null> {
    const espnMatches = await this.fetchPlayoffMatches(code);

    const byRound = (round: PlayoffRound) => espnMatches.filter((m) => m.round === round);

    const r16 = byRound('octavos');
    const qf = byRound('cuartos');
    const sf = byRound('semis');
    const fin = byRound('final');

    const hasKnockout = r16.length > 0 || qf.length > 0 || sf.length > 0 || fin.length > 0;
    const format = hasKnockout
      ? 'Round of 16 a doble partido · marcador agregado'
      : 'Round of 16 · Cruces a definir al término de la fase de grupos';

    return {
      format,
      rounds: {
        octavos: this.buildTies(r16, 8, 'octavos'),
        cuartos: this.buildTies(qf, 4, 'cuartos'),
        semis: this.buildTies(sf, 2, 'semis'),
        final: this.buildTies(fin, 1, 'final'),
      },
    };
  }

  /**
   * Agrupa hasta `count` partidos de doble vuelta (pares de ida+vuelta) en PlayoffMatch[]
   * mostrando el marcador agregado cuando ambos partidos están terminados.
   */
  private buildTies(
    espnMatches: EspnPlayoffMatch[],
    count: number,
    round: PlayoffRound,
  ): PlayoffMatch[] {
    // Agrupa por par de equipos (clave ordenada para capturar ida y vuelta)
    const tieMap = new Map<string, EspnPlayoffMatch[]>();
    for (const m of espnMatches) {
      const key = [this.normalize(m.homeTeam), this.normalize(m.awayTeam)].sort().join('|');
      const arr = tieMap.get(key) ?? [];
      arr.push(m);
      tieMap.set(key, arr);
    }

    const result: PlayoffMatch[] = [];
    let slot = 1;

    for (const legs of tieMap.values()) {
      if (result.length >= count) break;
      const sortedLegs = [...legs].sort((a, b) => {
        const ta = a.date ? new Date(a.date).getTime() : 0;
        const tb = b.date ? new Date(b.date).getTime() : 0;
        return ta - tb;
      });
      const first = sortedLegs[0];

      // Suma marcadores normalizando al equipo "home" del primer partido
      let homeAgg = 0;
      let awayAgg = 0;
      let legsPlayed = 0;

      for (const leg of sortedLegs) {
        if (leg.homeScore == null || leg.awayScore == null) continue;
        const flipped = this.normalize(leg.homeTeam) !== this.normalize(first.homeTeam);
        homeAgg += flipped ? leg.awayScore : leg.homeScore;
        awayAgg += flipped ? leg.homeScore : leg.awayScore;
        legsPlayed++;
      }

      const bothDone = sortedLegs.length >= 2 && sortedLegs.every((l) => l.status === 'finished');
      const status: PlayoffStatus = bothDone
        ? 'finished'
        : legsPlayed > 0
          ? 'scheduled'
          : first.status;

      let winner: 'home' | 'away' | null = null;
      if (bothDone) {
        if (homeAgg > awayAgg) {
          winner = 'home';
        } else if (awayAgg > homeAgg) {
          winner = 'away';
        } else {
          // Agregado empatado — buscar si la vuelta fue definida por penales
          const penLeg = legs.find((l) => l.penaltyWinner != null);
          if (penLeg) {
            const penNorm = this.normalize(penLeg.penaltyWinner!);
            const firstHomeNorm = this.normalize(first.homeTeam);
            winner = penNorm === firstHomeNorm ? 'home' : 'away';
          }
        }
      }
      const penaltyDecided = winner !== null && homeAgg === awayAgg;
      // Score de penales del leg decisivo
      const penLegFinal = legs.find((l) => l.penaltyWinner != null);
      const flippedPen = penLegFinal
        ? this.normalize(penLegFinal.homeTeam) !== this.normalize(first.homeTeam)
        : false;
      const homePenScore = penLegFinal
        ? (flippedPen ? penLegFinal.awayPenScore : penLegFinal.homePenScore)
        : null;
      const awayPenScore = penLegFinal
        ? (flippedPen ? penLegFinal.homePenScore : penLegFinal.awayPenScore)
        : null;

      const legsArr: PlayoffLeg[] = sortedLegs.slice(0, 2).map((l, idx) => ({
        leg: (idx + 1) as 1 | 2,
        homeTeam: l.homeTeam,
        awayTeam: l.awayTeam,
        homeScore: l.homeScore,
        awayScore: l.awayScore,
        status: l.status,
        date: l.date,
      }));

      result.push({
        round,
        slot: slot++,
        home: { team: first.homeTeam, teamLogo: null, seed: '' },
        away: { team: first.awayTeam, teamLogo: null, seed: '' },
        homeScore: legsPlayed > 0 ? homeAgg : null,
        awayScore: legsPlayed > 0 ? awayAgg : null,
        homePenScore: homePenScore ?? null,
        awayPenScore: awayPenScore ?? null,
        status,
        date: first.date,
        winner,
        penaltyDecided,
        legs: legsArr,
      });
    }

    // Rellena los slots vacíos (fase de grupos aún en curso)
    while (result.length < count) {
      result.push({
        round,
        slot: slot++,
        home: null,
        away: null,
        homeScore: null,
        awayScore: null,
        homePenScore: null,
        awayPenScore: null,
        status: 'pending',
        date: null,
        winner: null,
        penaltyDecided: false,
      });
    }

    return result;
  }
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CompetitionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompetitionsService = exports.COMPETITIONS = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const ESPN_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; RiverAppBot/2.0)' };
exports.COMPETITIONS = [
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
let CompetitionsService = CompetitionsService_1 = class CompetitionsService {
    logger = new common_1.Logger(CompetitionsService_1.name);
    standingsCache = new Map();
    playoffsCache = new Map();
    TTL = 15 * 60 * 1000;
    list() {
        return exports.COMPETITIONS;
    }
    findByCode(code) {
        const meta = exports.COMPETITIONS.find((c) => c.code === code);
        if (!meta) {
            throw new common_1.NotFoundException(`Competición desconocida: ${code}`);
        }
        return meta;
    }
    async getStandings(code) {
        const meta = this.findByCode(code);
        if (!meta.hasStandings) {
            return { meta, groups: [], playoffs: null, lastUpdated: new Date().toISOString() };
        }
        const cached = this.standingsCache.get(code);
        let groups;
        let cacheTs;
        if (cached && Date.now() - cached.ts < this.TTL) {
            groups = cached.data;
            cacheTs = cached.ts;
        }
        else {
            const fresh = await this.fetchGroups(code, cached?.data);
            if (fresh.length > 0) {
                this.applyTrends(fresh, cached?.data ?? null);
                const prev = cached?.data ?? null;
                cacheTs = Date.now();
                this.standingsCache.set(code, { data: fresh, prev, ts: cacheTs });
                groups = fresh;
            }
            else {
                groups = cached?.data ?? [];
                cacheTs = cached?.ts ?? Date.now();
            }
        }
        let playoffs = null;
        if (code === 'arg.1') {
            playoffs = await this.buildPlayoffsBracket(code, groups);
        }
        else if (code === 'conmebol.libertadores' || code === 'conmebol.sudamericana') {
            playoffs = await this.buildCopaBracket(code);
        }
        return { meta, groups, playoffs, lastUpdated: new Date(cacheTs).toISOString() };
    }
    applyTrends(newGroups, oldGroups) {
        if (!oldGroups) {
            for (const g of newGroups) {
                for (const row of g.standings)
                    row.trend = 'same';
            }
            return;
        }
        for (const newGroup of newGroups) {
            const oldGroup = oldGroups.find((g) => g.key === newGroup.key);
            for (const row of newGroup.standings) {
                const oldRow = oldGroup?.standings.find((r) => this.normalize(r.team) === this.normalize(row.team));
                if (!oldRow) {
                    row.trend = 'same';
                    continue;
                }
                if (row.pos < oldRow.pos)
                    row.trend = 'up';
                else if (row.pos > oldRow.pos)
                    row.trend = 'down';
                else
                    row.trend = 'same';
            }
        }
    }
    async fetchGroups(code, fallback) {
        try {
            const url = `https://site.api.espn.com/apis/v2/sports/soccer/${code}/standings`;
            const res = await axios_1.default.get(url, { headers: ESPN_HEADERS, timeout: 10000 });
            const children = Array.isArray(res.data?.children) ? res.data.children : [];
            if (children.length > 0) {
                return children
                    .map((child, idx) => this.parseGroup(child, idx))
                    .filter((g) => g.standings.length > 0);
            }
            const entries = res.data?.standings?.entries ?? [];
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
        }
        catch (e) {
            this.logger.warn(`⚠️ ESPN standings [${code}] falló: ${e?.message}`);
            return fallback ?? [];
        }
    }
    parseGroup(child, idx) {
        const entries = child?.standings?.entries ?? [];
        const standings = this.parseEntries(entries);
        const { name, key } = this.normalizeGroupLabel(child, idx);
        return { name, key, standings };
    }
    normalizeGroupLabel(child, idx) {
        const raw = child?.name ?? child?.abbreviation ?? '';
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
    parseEntries(entries) {
        return entries
            .map((e) => {
            const get = (key) => {
                const stat = e.stats?.find((s) => s.name === key || s.type === key);
                if (!stat)
                    return 0;
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
    async fetchPlayoffMatches(code) {
        const cached = this.playoffsCache.get(code);
        if (cached && Date.now() - cached.ts < this.TTL) {
            return cached.data;
        }
        try {
            const year = new Date().getUTCFullYear();
            const from = `${year}0501`;
            const to = code === 'arg.1' ? `${year}0831` : `${year}1231`;
            const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${code}/scoreboard?dates=${from}-${to}`;
            const res = await axios_1.default.get(url, { headers: ESPN_HEADERS, timeout: 10000 });
            const events = Array.isArray(res.data?.events) ? res.data.events : [];
            const matches = [];
            for (const ev of events) {
                const seasonSlug = ev?.season?.slug ?? '';
                const round = this.parseRoundFromSeason(seasonSlug);
                if (!round)
                    continue;
                const comp = ev?.competitions?.[0];
                const competitors = comp?.competitors ?? [];
                const home = competitors.find((c) => c.homeAway === 'home');
                const away = competitors.find((c) => c.homeAway === 'away');
                if (!home || !away)
                    continue;
                const statusName = ev?.status?.type?.name ?? '';
                const completed = !!ev?.status?.type?.completed;
                const status = this.mapStatus(statusName, completed);
                const homeScoreRaw = home.score;
                const awayScoreRaw = away.score;
                const hasScore = status === 'finished' || status === 'live';
                const homeScore = hasScore ? this.parseScore(homeScoreRaw) : null;
                const awayScore = hasScore ? this.parseScore(awayScoreRaw) : null;
                const homeWins = home?.winner === true;
                const awayWins = away?.winner === true;
                const tiedScore = homeScore !== null && awayScore !== null && homeScore === awayScore;
                const penaltyWinner = (status === 'finished' && tiedScore && (homeWins || awayWins))
                    ? (homeWins ? (home?.team?.displayName ?? '') : (away?.team?.displayName ?? ''))
                    : null;
                let homePenScore = null;
                let awayPenScore = null;
                if (penaltyWinner) {
                    const penStatNames = ['penalties', 'pk', 'penaltygoals', 'penalty kicks'];
                    const hps = home?.statistics?.find((s) => penStatNames.includes((s.name ?? '').toLowerCase()));
                    const aps = away?.statistics?.find((s) => penStatNames.includes((s.name ?? '').toLowerCase()));
                    if (hps != null || aps != null) {
                        homePenScore = hps != null ? Number(hps.value ?? hps.displayValue ?? null) : null;
                        awayPenScore = aps != null ? Number(aps.value ?? aps.displayValue ?? null) : null;
                    }
                    if (homePenScore == null) {
                        const notes = comp?.notes ?? [];
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
        }
        catch (e) {
            this.logger.warn(`⚠️ ESPN scoreboard playoffs [${code}] falló: ${e?.message}`);
            return cached?.data ?? [];
        }
    }
    parseRoundFromSeason(slug) {
        const s = (slug || '').toLowerCase();
        if (s.includes('round-of-16') || s.includes('octavos') || s.includes('knockout-round-playoff'))
            return 'octavos';
        if (s.includes('quarter'))
            return 'cuartos';
        if (s.includes('semi'))
            return 'semis';
        if (s.includes('final') && !s.includes('apertura-final-stage'))
            return 'final';
        return null;
    }
    mapStatus(statusName, completed) {
        const s = statusName.toUpperCase();
        const finishedNames = ['STATUS_FINAL', 'STATUS_FULL_TIME', 'STATUS_FINAL_PEN', 'STATUS_FINAL_AET', 'STATUS_FINAL_PEN_AET'];
        if (completed || finishedNames.includes(s))
            return 'finished';
        if (s === 'STATUS_IN_PROGRESS' ||
            s === 'STATUS_HALFTIME' ||
            s === 'STATUS_FIRST_HALF' ||
            s === 'STATUS_SECOND_HALF') {
            return 'live';
        }
        if (s === 'STATUS_SCHEDULED')
            return 'scheduled';
        return 'pending';
    }
    parseScore(raw) {
        if (raw == null)
            return null;
        if (typeof raw === 'number')
            return raw;
        if (typeof raw === 'string') {
            const n = parseInt(raw, 10);
            return Number.isNaN(n) ? null : n;
        }
        if (typeof raw === 'object') {
            if (typeof raw.value === 'number')
                return raw.value;
            if (typeof raw.displayValue === 'string') {
                const n = parseInt(raw.displayValue, 10);
                return Number.isNaN(n) ? null : n;
            }
        }
        return null;
    }
    async buildPlayoffsBracket(code, groups) {
        const zonaA = groups.find((g) => g.key === 'A');
        const zonaB = groups.find((g) => g.key === 'B');
        if (!zonaA || !zonaB)
            return null;
        if (zonaA.standings.length < 8 || zonaB.standings.length < 8)
            return null;
        const playoffMatches = await this.fetchPlayoffMatches(code);
        const seedFromZone = (group, pos) => {
            const row = group.standings[pos - 1];
            if (!row)
                return null;
            return { team: row.team, teamLogo: row.teamLogo, seed: `${group.key}${pos}` };
        };
        const buildMatch = (round, slot, home, away) => {
            const espnMatch = home && away ? this.findEspnMatch(home.team, away.team, round, playoffMatches) : null;
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
            const flipped = this.normalize(espnMatch.homeTeam) !== this.normalize(home.team);
            const homeScore = flipped ? espnMatch.awayScore : espnMatch.homeScore;
            const awayScore = flipped ? espnMatch.homeScore : espnMatch.awayScore;
            const homePenScore = flipped ? espnMatch.awayPenScore : espnMatch.homePenScore;
            const awayPenScore = flipped ? espnMatch.homePenScore : espnMatch.awayPenScore;
            let winner = null;
            if (espnMatch.status === 'finished' && homeScore != null && awayScore != null) {
                if (homeScore > awayScore) {
                    winner = 'home';
                }
                else if (awayScore > homeScore) {
                    winner = 'away';
                }
                else if (espnMatch.penaltyWinner) {
                    const penNorm = this.normalize(espnMatch.penaltyWinner);
                    const homeNorm = this.normalize(home.team);
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
        const winnerSeed = (m) => {
            if (!m || !m.winner)
                return null;
            return m.winner === 'home' ? m.home : m.away;
        };
        const octavos = [
            buildMatch('octavos', 1, seedFromZone(zonaA, 1), seedFromZone(zonaB, 8)),
            buildMatch('octavos', 2, seedFromZone(zonaB, 4), seedFromZone(zonaA, 5)),
            buildMatch('octavos', 3, seedFromZone(zonaB, 2), seedFromZone(zonaA, 7)),
            buildMatch('octavos', 4, seedFromZone(zonaA, 3), seedFromZone(zonaB, 6)),
            buildMatch('octavos', 5, seedFromZone(zonaB, 1), seedFromZone(zonaA, 8)),
            buildMatch('octavos', 6, seedFromZone(zonaA, 4), seedFromZone(zonaB, 5)),
            buildMatch('octavos', 7, seedFromZone(zonaA, 2), seedFromZone(zonaB, 7)),
            buildMatch('octavos', 8, seedFromZone(zonaB, 3), seedFromZone(zonaA, 6)),
        ];
        const cuartos = [
            buildMatch('cuartos', 1, winnerSeed(octavos[0]), winnerSeed(octavos[1])),
            buildMatch('cuartos', 2, winnerSeed(octavos[2]), winnerSeed(octavos[3])),
            buildMatch('cuartos', 3, winnerSeed(octavos[4]), winnerSeed(octavos[5])),
            buildMatch('cuartos', 4, winnerSeed(octavos[6]), winnerSeed(octavos[7])),
        ];
        const semis = [
            buildMatch('semis', 1, winnerSeed(cuartos[0]), winnerSeed(cuartos[1])),
            buildMatch('semis', 2, winnerSeed(cuartos[2]), winnerSeed(cuartos[3])),
        ];
        const final = [
            buildMatch('final', 1, winnerSeed(semis[0]), winnerSeed(semis[1])),
        ];
        return {
            format: 'Octavos a partido único · cruces inter-zona (Top 8 de cada Zona)',
            rounds: { octavos, cuartos, semis, final },
        };
    }
    findEspnMatch(teamA, teamB, round, matches) {
        const a = this.normalize(teamA);
        const b = this.normalize(teamB);
        return (matches.find((m) => {
            if (m.round !== round)
                return false;
            const home = this.normalize(m.homeTeam);
            const away = this.normalize(m.awayTeam);
            return (home === a && away === b) || (home === b && away === a);
        }) ?? null);
    }
    normalize(s) {
        return (s || '').toLowerCase().trim();
    }
    async buildCopaBracket(code) {
        const espnMatches = await this.fetchPlayoffMatches(code);
        const byRound = (round) => espnMatches.filter((m) => m.round === round);
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
    buildTies(espnMatches, count, round) {
        const tieMap = new Map();
        for (const m of espnMatches) {
            const key = [this.normalize(m.homeTeam), this.normalize(m.awayTeam)].sort().join('|');
            const arr = tieMap.get(key) ?? [];
            arr.push(m);
            tieMap.set(key, arr);
        }
        const result = [];
        let slot = 1;
        for (const legs of tieMap.values()) {
            if (result.length >= count)
                break;
            const first = legs[0];
            let homeAgg = 0;
            let awayAgg = 0;
            let legsPlayed = 0;
            for (const leg of legs) {
                if (leg.homeScore == null || leg.awayScore == null)
                    continue;
                const flipped = this.normalize(leg.homeTeam) !== this.normalize(first.homeTeam);
                homeAgg += flipped ? leg.awayScore : leg.homeScore;
                awayAgg += flipped ? leg.homeScore : leg.awayScore;
                legsPlayed++;
            }
            const bothDone = legs.length >= 2 && legs.every((l) => l.status === 'finished');
            const status = bothDone
                ? 'finished'
                : legsPlayed > 0
                    ? 'scheduled'
                    : first.status;
            let winner = null;
            if (bothDone) {
                if (homeAgg > awayAgg) {
                    winner = 'home';
                }
                else if (awayAgg > homeAgg) {
                    winner = 'away';
                }
                else {
                    const penLeg = legs.find((l) => l.penaltyWinner != null);
                    if (penLeg) {
                        const penNorm = this.normalize(penLeg.penaltyWinner);
                        const firstHomeNorm = this.normalize(first.homeTeam);
                        winner = penNorm === firstHomeNorm ? 'home' : 'away';
                    }
                }
            }
            const penaltyDecided = winner !== null && homeAgg === awayAgg;
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
            });
        }
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
};
exports.CompetitionsService = CompetitionsService;
exports.CompetitionsService = CompetitionsService = CompetitionsService_1 = __decorate([
    (0, common_1.Injectable)()
], CompetitionsService);
//# sourceMappingURL=competitions.service.js.map
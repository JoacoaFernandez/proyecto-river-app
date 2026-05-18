"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var LiveApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveApiService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const matches_service_1 = require("./matches/matches.service");
const prisma_service_1 = require("./prisma/prisma.service");
const ESPN_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; RiverAppBot/2.0)' };
let LiveApiService = LiveApiService_1 = class LiveApiService {
    matchesService;
    prisma;
    logger = new common_1.Logger(LiveApiService_1.name);
    cache = null;
    lastFetch = 0;
    constructor(matchesService, prisma) {
        this.matchesService = matchesService;
        this.prisma = prisma;
    }
    async getDashboardData() {
        if (this.cache && Date.now() - this.lastFetch < 60_000) {
            return this.cache;
        }
        const [latest, upcomingList, pastList] = await Promise.all([
            this.matchesService.getLatestMatch(),
            this.matchesService.getUpcomingMatches(10),
            this.matchesService.getPastMatches(40),
        ]);
        const nextMatch = upcomingList.find((m) => m.status !== 'finished') ?? null;
        const lastFinished = pastList.find((m) => m.status === 'finished') ?? null;
        let lastMatchGoalEvents = [];
        if (lastFinished) {
            const evts = await this.prisma.matchEvent.findMany({
                where: { matchId: lastFinished.id, type: { in: ['goal', 'own-goal', 'penalty-goal'] } },
                orderBy: { minute: 'asc' },
                select: { playerName: true, minute: true, team: true, type: true },
            });
            lastMatchGoalEvents = evts;
        }
        const lastMatch = lastFinished ? { ...lastFinished, goalEvents: lastMatchGoalEvents } : null;
        const formatMatch = (m) => {
            if (!m)
                return null;
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
                referee: m.referee ?? null,
                tvChannel: m.tvChannel ?? null,
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
    async fetchStandingsAndStats(pastMatches) {
        let table = [];
        let stats = this.computeStatsFromMatches(pastMatches);
        const localStats = stats;
        try {
            const goalEvents = await this.prisma.matchEvent.findMany({
                where: { type: { in: ['goal', 'penalty-goal'] }, playerName: { not: null } },
                select: { playerName: true },
                take: 300,
            });
            const scorerMap = new Map();
            for (const e of goalEvents) {
                if (e.playerName)
                    scorerMap.set(e.playerName, (scorerMap.get(e.playerName) ?? 0) + 1);
            }
            const top = [...scorerMap.entries()].sort((a, b) => b[1] - a[1])[0];
            if (top)
                stats.topScorer = `${top[0]} (${top[1]})`;
        }
        catch { }
        try {
            stats = { ...stats, penaltyGoals: await this.prisma.matchEvent.count({ where: { type: 'penalty-goal' } }) };
        }
        catch { }
        try {
            const url = 'https://site.api.espn.com/apis/v2/sports/soccer/arg.1/standings';
            const res = await axios_1.default.get(url, { headers: ESPN_HEADERS, timeout: 10000 });
            const entries = res.data?.children?.[0]?.standings?.entries
                ?? res.data?.standings?.entries
                ?? [];
            table = entries.map((e) => {
                const valueOf = (key) => {
                    const stat = e.stats?.find((s) => s.name === key || s.type === key);
                    if (!stat)
                        return 0;
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
            const riverEntry = entries.find((e) => /river plate/i.test(e.team?.displayName ?? e.team?.name ?? ''));
            if (riverEntry) {
                const get = (k) => {
                    const s = riverEntry.stats?.find((x) => x.name === k || x.type === k);
                    if (!s)
                        return 0;
                    return typeof s.value === 'number' ? s.value : parseInt(s.displayValue ?? '0', 10);
                };
                stats = {
                    pj: get('gamesPlayed'),
                    pg: get('wins'),
                    pe: get('ties'),
                    pp: get('losses'),
                    gf: get('pointsFor'),
                    gc: get('pointsAgainst'),
                    streak: localStats.streak,
                    bestStreak: localStats.bestStreak,
                    penaltyGoals: stats.penaltyGoals ?? 0,
                    topScorer: stats.topScorer,
                };
            }
        }
        catch (e) {
            this.logger.warn(`ESPN standings falló: ${e?.message}. Usando stats locales.`);
        }
        return { table, stats };
    }
    computeStatsFromMatches(past) {
        const finished = past.filter((m) => m.status === 'finished').slice(0, 38);
        let pg = 0, pe = 0, pp = 0, gf = 0, gc = 0;
        const streakBuf = [];
        let maxWinStreak = 0, curWinStreak = 0;
        for (const m of finished) {
            const isHome = /river/i.test(m.homeTeam);
            const our = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
            const them = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
            gf += our;
            gc += them;
            if (our > them) {
                pg++;
                streakBuf.push('W');
                curWinStreak++;
                maxWinStreak = Math.max(maxWinStreak, curWinStreak);
            }
            else {
                if (our === them) {
                    pe++;
                    streakBuf.push('D');
                }
                else {
                    pp++;
                    streakBuf.push('L');
                }
                curWinStreak = 0;
            }
        }
        return {
            pj: finished.length,
            pg, pe, pp, gf, gc,
            streak: this.parseForm(streakBuf.slice(0, 5).join('')),
            bestStreak: maxWinStreak > 0 ? `${maxWinStreak} victorias seguidas` : '-',
            topScorer: 'N/A',
        };
    }
    parseForm(form) {
        if (!form)
            return '-';
        const w = (form.match(/W/g) || []).length;
        if (w >= 3)
            return `${w} victorias en ${form.length} PJ`;
        if (form.includes('L'))
            return 'Irregular';
        return 'Estable';
    }
    invalidateCache() {
        this.cache = null;
        this.lastFetch = 0;
    }
    logoCache = {};
    logoLastFetch = 0;
    LOGO_LEAGUES = [
        'arg.1', 'arg.2',
        'conmebol.libertadores', 'conmebol.sudamericana', 'conmebol.recopa',
        'arg.copa', 'arg.supercopa',
        'bra.1', 'uru.1', 'par.1', 'chi.1', 'col.1', 'ecu.1', 'per.1', 'bol.1', 'ven.1',
    ];
    async getTeamLogos() {
        const TTL = 24 * 60 * 60 * 1000;
        if (Object.keys(this.logoCache).length > 0 && Date.now() - this.logoLastFetch < TTL) {
            return this.logoCache;
        }
        const map = {};
        await Promise.allSettled(this.LOGO_LEAGUES.map(async (league) => {
            try {
                const res = await axios_1.default.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams?limit=100`, { headers: ESPN_HEADERS, timeout: 8000 });
                const teams = res.data?.sports?.[0]?.leagues?.[0]?.teams ?? [];
                for (const entry of teams) {
                    const t = entry.team;
                    if (t?.displayName && t?.logos?.[0]?.href) {
                        map[t.displayName.toLowerCase()] = t.logos[0].href;
                    }
                    else if (t?.displayName && t?.logo) {
                        map[t.displayName.toLowerCase()] = t.logo;
                    }
                }
            }
            catch {
            }
        }));
        if (Object.keys(map).length > 0) {
            this.logoCache = map;
            this.logoLastFetch = Date.now();
        }
        return this.logoCache;
    }
    async getLiveMatch() {
        const LIVE_LEAGUES = ['arg.1', 'conmebol.libertadores', 'conmebol.sudamericana', 'arg.copa'];
        for (const league of LIVE_LEAGUES) {
            try {
                const res = await axios_1.default.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard`, { headers: ESPN_HEADERS, timeout: 8000 });
                const events = res.data?.events ?? [];
                const liveEvent = events.find((ev) => {
                    const state = ev.status?.type?.state ?? '';
                    const competitors = ev.competitions?.[0]?.competitors ?? [];
                    const hasRiver = competitors.some((c) => /river plate/i.test(c.team?.displayName ?? ''));
                    return hasRiver && state === 'in';
                });
                if (!liveEvent)
                    continue;
                const summary = await axios_1.default.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${liveEvent.id}`, { headers: ESPN_HEADERS, timeout: 8000 });
                const payload = this.parseLiveMatch(liveEvent, summary.data);
                this.persistEventsForMatch(payload.events).catch((e) => this.logger.warn(`Auto-persist events falló: ${e?.message}`));
                return payload;
            }
            catch (e) {
                if (e?.response?.status !== 404) {
                    this.logger.warn(`getLiveMatch [${league}] falló: ${e?.message}`);
                }
            }
        }
        return null;
    }
    async syncEventsForFinishedMatch(matchId, espnEventId) {
        try {
            const summary = await axios_1.default.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/summary?event=${espnEventId}`, { headers: ESPN_HEADERS, timeout: 8000 });
            const events = this.parseEspnKeyEvents(summary.data);
            if (events.length > 0) {
                await this.persistEventsForMatchById(matchId, events);
                this.logger.log(`📋 ${events.length} eventos sincronizados para partido ${matchId}`);
            }
        }
        catch (e) {
            this.logger.warn(`syncEventsForFinishedMatch falló: ${e?.message}`);
        }
    }
    async persistEventsForMatch(events) {
        if (events.length === 0)
            return;
        const liveMatch = await this.prisma.match.findFirst({
            where: { status: 'live' },
            orderBy: { date: 'desc' },
        });
        if (!liveMatch)
            return;
        await this.persistEventsForMatchById(liveMatch.id, events);
    }
    async persistEventsForMatchById(matchId, events) {
        const existingCount = await this.prisma.matchEvent.count({ where: { matchId } });
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
    parseLiveMatch(event, summary) {
        const comp = event.competitions?.[0] ?? {};
        const competitors = comp.competitors ?? [];
        const home = competitors.find((c) => c.homeAway === 'home') ?? competitors[0] ?? {};
        const away = competitors.find((c) => c.homeAway === 'away') ?? competitors[1] ?? {};
        const scoringPlays = (summary.scoringPlays ?? []).map((sp) => {
            const typeText = (sp.type?.text ?? '').toLowerCase();
            const type = typeText.includes('own') ? 'own-goal' :
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
        const statistics = this.parseEspnStatistics(summary);
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
            statistics,
        };
    }
    parseEspnStatistics(summary) {
        const STAT_MAP = {
            possessionPct: 'Posesión',
            totalShots: 'Tiros',
            shotsOnTarget: 'Al arco',
            blockedShots: 'Bloqueados',
            cornerKicks: 'Córners',
            fouls: 'Faltas',
            offsides: 'Offsides',
            yellowCards: 'Tarjetas amarillas',
            saves: 'Atajadas',
            passAccuracy: 'Precisión de pases',
        };
        try {
            const teams = summary?.boxscore?.teams ?? [];
            if (teams.length < 2)
                return [];
            const homeStats = teams[0]?.statistics ?? [];
            const awayStats = teams[1]?.statistics ?? [];
            const result = [];
            for (const hs of homeStats) {
                const name = hs.name ?? '';
                const label = STAT_MAP[name];
                if (!label)
                    continue;
                const as_ = awayStats.find((s) => s.name === name);
                if (!as_)
                    continue;
                const homeVal = String(hs.displayValue ?? hs.value ?? '0');
                const awayVal = String(as_.displayValue ?? as_.value ?? '0');
                let homePct;
                const hNum = parseFloat(homeVal.replace('%', ''));
                const aNum = parseFloat(awayVal.replace('%', ''));
                if (!isNaN(hNum) && !isNaN(aNum)) {
                    if (homeVal.includes('%')) {
                        homePct = hNum;
                    }
                    else {
                        const total = hNum + aNum;
                        homePct = total > 0 ? Math.round((hNum / total) * 100) : 50;
                    }
                }
                result.push({ label, home: homeVal, away: awayVal, homePct });
            }
            return result;
        }
        catch {
            return [];
        }
    }
    parseEspnKeyEvents(summary) {
        const events = [];
        const keyEvents = summary.keyEvents ?? [];
        const goalKeys = new Set();
        for (const sp of (summary.scoringPlays ?? [])) {
            const typeText = (sp.type?.text ?? '').toLowerCase();
            let type = 'goal';
            if (typeText.includes('own'))
                type = 'own-goal';
            else if (typeText.includes('penalty'))
                type = 'penalty-goal';
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
            const typeText = (ke.type?.text ?? ke.text ?? '').toLowerCase();
            const clock = ke.clock?.displayValue ?? ke.time?.displayValue ?? '0';
            const minute = parseInt(clock.replace("'", ''), 10) || 0;
            const team = ke.team?.displayName ?? '';
            const player = ke.participants?.[0]?.athlete?.displayName ?? null;
            const period = ke.period?.number ?? 1;
            const isGoalEvent = typeText === 'goal' || typeText === 'gol' ||
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
            }
            else if (typeText.includes('red card') || typeText.includes('tarjeta roja')) {
                events.push({
                    id: `espn-rc-${minute}-${player ?? ''}`, type: 'red-card',
                    minute, team, playerName: player, playerInName: null, assistName: null, detail: null, period,
                });
            }
            else if (typeText.includes('substitution') || typeText.includes('sustituci')) {
                events.push({
                    id: `espn-sub-${minute}-${player ?? ''}`, type: 'substitution',
                    minute, team, playerName: player,
                    playerInName: ke.participants?.[1]?.athlete?.displayName ?? null,
                    assistName: null, detail: null, period,
                });
            }
            else if (typeText.includes('var') || typeText.includes('video review')) {
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
};
exports.LiveApiService = LiveApiService;
exports.LiveApiService = LiveApiService = LiveApiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [matches_service_1.MatchesService,
        prisma_service_1.PrismaService])
], LiveApiService);
//# sourceMappingURL=live-api.service.js.map
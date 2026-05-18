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
var MatchesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchesService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const axios_1 = __importDefault(require("axios"));
const predictions_service_1 = require("../predictions/predictions.service");
const RIVER_CANON = 'River Plate';
const RIVER_NAMES = ['river plate', 'club atletico river plate', 'club atlético river plate'];
const ESPN_LEAGUES = [
    { code: 'arg.1', name: 'Liga Profesional Argentina' },
    { code: 'conmebol.libertadores', name: 'Copa Libertadores' },
    { code: 'conmebol.sudamericana', name: 'Copa Sudamericana' },
];
const AXIOS_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; RiverAppBot/2.0)',
    Accept: 'application/json',
};
const normalizeStr = (s) => s.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
const isRiverArgentina = (name, country) => {
    if (!name)
        return false;
    const n = normalizeStr(name);
    const hasRiver = RIVER_NAMES.some(r => n.includes(r));
    if (!hasRiver)
        return false;
    if (country) {
        const c = normalizeStr(country);
        if (c.includes('uruguay') || c.includes('brasil') || c.includes('chile'))
            return false;
    }
    return true;
};
const isRiver = (name) => !!name && RIVER_NAMES.some(r => normalizeStr(name).includes(r));
function normalizeTeams(homeTeam, awayTeam, homeScore, awayScore) {
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
function dedup(matches) {
    const seen = new Set();
    return matches.filter(m => {
        try {
            const key = `${new Date(m.date).toISOString()}|${normalizeStr(m.homeTeam)}|${normalizeStr(m.awayTeam)}`;
            if (seen.has(key))
                return false;
            seen.add(key);
            return true;
        }
        catch {
            return true;
        }
    });
}
let MatchesService = MatchesService_1 = class MatchesService {
    prisma;
    predictionsService;
    logger = new common_1.Logger(MatchesService_1.name);
    sportsDbTeamId = null;
    espnTeamId = null;
    syncInProgress = false;
    constructor(prisma, predictionsService) {
        this.prisma = prisma;
        this.predictionsService = predictionsService;
    }
    async onModuleInit() {
        this.logger.log('⚡ Motor de Fixture River Plate iniciando...');
        setTimeout(() => this.syncMatches(), 3000);
        setTimeout(() => this.backfillMissingEventsAndStats(), 20000);
    }
    async handleCron() {
        await this.syncMatches();
    }
    async backfillMissingEventsAndStats() {
        try {
            this.logger.log('🔁 Iniciando backfill de eventos y estadísticas...');
            const matchesWithoutEvents = await this.prisma.match.findMany({
                where: {
                    status: 'finished',
                    events: { none: {} },
                },
                orderBy: { date: 'desc' },
                take: 30,
            });
            this.logger.log(`🔁 ${matchesWithoutEvents.length} partidos sin eventos para backfill.`);
            let processed = 0;
            for (const match of matchesWithoutEvents) {
                await new Promise((r) => setTimeout(r, 1500));
                await this.autoSyncEventsForMatch(match.id, match.homeTeam, match.awayTeam, match.date);
                processed++;
            }
            const matchesWithoutStats = await this.prisma.match.findMany({
                where: {
                    status: 'finished',
                    statistics: { equals: null },
                    events: { some: {} },
                },
                orderBy: { date: 'desc' },
                take: 20,
            });
            this.logger.log(`📊 ${matchesWithoutStats.length} partidos sin estadísticas para backfill.`);
            for (const match of matchesWithoutStats) {
                await new Promise((r) => setTimeout(r, 1500));
                await this.autoSyncEventsForMatch(match.id, match.homeTeam, match.awayTeam, match.date);
            }
            this.logger.log(`✅ Backfill completado: ${processed} partidos procesados.`);
        }
        catch (e) {
            this.logger.warn(`Backfill falló: ${e?.message}`);
        }
    }
    async findAll() {
        return this.prisma.match.findMany({ orderBy: { date: 'asc' } });
    }
    async findOne(id) {
        let match = await this.prisma.match.findUnique({
            where: { id },
            include: { events: { orderBy: [{ period: 'asc' }, { minute: 'asc' }] } },
        });
        const GOAL_TYPES = new Set(['goal', 'own-goal', 'penalty-goal']);
        const hasGoalEvents = match?.events?.some(e => GOAL_TYPES.has(e.type)) ?? false;
        const totalGoals = (match?.homeScore ?? 0) + (match?.awayScore ?? 0);
        const needsSync = match?.status === 'finished' && (!match.statistics || (totalGoals > 0 && !hasGoalEvents));
        if (match && needsSync) {
            try {
                await this.autoSyncEventsForMatch(match.id, match.homeTeam, match.awayTeam, match.date);
                match = await this.prisma.match.findUnique({
                    where: { id },
                    include: { events: { orderBy: [{ period: 'asc' }, { minute: 'asc' }] } },
                });
            }
            catch { }
        }
        return match;
    }
    async createManual(data) {
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
    async updateMatch(id, data) {
        const update = {};
        if (data.status !== undefined)
            update.status = data.status;
        if (data.homeScore !== undefined)
            update.homeScore = data.homeScore;
        if (data.awayScore !== undefined)
            update.awayScore = data.awayScore;
        if (data.minute !== undefined)
            update.minute = data.minute;
        if (data.competition !== undefined)
            update.competition = data.competition;
        if (data.stadium !== undefined)
            update.stadium = data.stadium;
        if (data.date !== undefined)
            update.date = new Date(data.date);
        return this.prisma.match.update({ where: { id }, data: update });
    }
    async updateStatistics(id, stats) {
        return this.prisma.match.update({ where: { id }, data: { statistics: stats } });
    }
    async updatePhotos(id, photos) {
        return this.prisma.match.update({ where: { id }, data: { photos: photos } });
    }
    async removeMatch(id) {
        return this.prisma.match.delete({ where: { id } });
    }
    async getUpcomingMatches(limit = 10) {
        const now = new Date();
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
    async getH2H(rival, limit = 6) {
        if (!rival?.trim())
            return [];
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
        const live = await this.prisma.match.findFirst({
            where: { status: 'live' },
            orderBy: { date: 'desc' },
        });
        if (live)
            return live;
        const next = await this.prisma.match.findFirst({
            where: { status: 'scheduled', date: { gte: now } },
            orderBy: { date: 'asc' },
        });
        if (next)
            return next;
        const anyScheduled = await this.prisma.match.findFirst({
            where: { status: 'scheduled' },
            orderBy: { date: 'asc' },
        });
        if (anyScheduled)
            return anyScheduled;
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
    async getDebugInfo() {
        const all = await this.prisma.match.findMany({ orderBy: { date: 'asc' } });
        return {
            total: all.length,
            byStatus: {
                live: all.filter(m => m.status === 'live').length,
                scheduled: all.filter(m => m.status === 'scheduled').length,
                finished: all.filter(m => m.status === 'finished').length,
            },
            types: [...new Set(all.map(m => m.type))],
            sample: all.slice(0, 5).map(m => ({
                type: m.type,
                status: m.status,
                date: m.date,
                home: m.homeTeam,
                away: m.awayTeam,
                competition: m.competition,
            })),
            upcoming: all
                .filter(m => m.status === 'scheduled')
                .slice(0, 3)
                .map(m => ({ date: m.date, home: m.homeTeam, away: m.awayTeam, status: m.status })),
        };
    }
    async autoSyncEventsForMatch(matchId, homeTeam, awayTeam, matchDate) {
        try {
            const dateStr = matchDate.toISOString().slice(0, 10).replace(/-/g, '');
            const dayBefore = new Date(matchDate.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
            const dayAfter = new Date(matchDate.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
            let espnEventId = null;
            let espnLeague = 'arg.1';
            for (const league of ESPN_LEAGUES) {
                try {
                    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard?dates=${dayBefore}-${dayAfter}`;
                    const res = await axios_1.default.get(url, { headers: AXIOS_HEADERS, timeout: 8000 });
                    const events = res.data?.events ?? [];
                    const riverEvent = events.find((ev) => {
                        const competitors = ev.competitions?.[0]?.competitors ?? [];
                        return competitors.some((c) => /river plate/i.test(c.team?.displayName ?? ''));
                    });
                    if (riverEvent) {
                        espnEventId = String(riverEvent.id);
                        espnLeague = league.code;
                        break;
                    }
                }
                catch { }
            }
            if (!espnEventId) {
                this.logger.warn(`📋 No se encontró evento ESPN para ${homeTeam} vs ${awayTeam} (${dateStr})`);
                return;
            }
            const leaguesToTry = [espnLeague, ...ESPN_LEAGUES.map(l => l.code).filter(c => c !== espnLeague)];
            let summaryData;
            for (const leagueCode of leaguesToTry) {
                try {
                    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueCode}/summary?event=${espnEventId}`;
                    const res = await axios_1.default.get(url, { headers: AXIOS_HEADERS, timeout: 8000 });
                    const hasStats = (res.data?.boxScore?.teams?.length ?? 0) >= 2 ||
                        (res.data?.statistics?.[0]?.teams?.length ?? 0) >= 2;
                    if (!summaryData)
                        summaryData = res.data;
                    if (hasStats) {
                        summaryData = res.data;
                        break;
                    }
                }
                catch { }
            }
            this.logger.log(`📊 Summary [${espnLeague}/${espnEventId}]: keys=[${Object.keys(summaryData || {}).join(', ')}]`);
            if (!summaryData) {
                this.logger.warn(`📋 No se pudo obtener summary ESPN para evento ${espnEventId}`);
                return;
            }
            const parsedEvents = this.parseEspnSummaryEvents(summaryData);
            if (parsedEvents.length > 0) {
                const existingCount = await this.prisma.matchEvent.count({ where: { matchId } });
                if (parsedEvents.length >= existingCount || existingCount === 0) {
                    await this.prisma.matchEvent.deleteMany({ where: { matchId } });
                    await this.prisma.matchEvent.createMany({
                        data: parsedEvents.map((e) => ({
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
                    this.logger.log(`📋 ${parsedEvents.length} eventos auto-sincronizados para ${homeTeam} vs ${awayTeam}`);
                }
            }
            else {
                this.logger.log(`📋 Sin eventos ESPN para ${homeTeam} vs ${awayTeam}`);
            }
            const stats = this.parseEspnMatchStats(summaryData);
            if (stats) {
                await this.prisma.match.update({
                    where: { id: matchId },
                    data: { statistics: stats },
                });
                this.logger.log(`📊 Estadísticas guardadas para ${homeTeam} vs ${awayTeam}`);
            }
        }
        catch (e) {
            this.logger.warn(`📋 autoSyncEventsForMatch falló: ${e?.message}`);
        }
    }
    parseEspnMatchStats(summary) {
        try {
            const boxTeams = summary?.boxscore?.teams ?? summary?.boxScore?.teams ?? [];
            let statTeams = [];
            if (Array.isArray(summary?.statistics)) {
                for (const group of summary.statistics) {
                    if (Array.isArray(group?.teams) && group.teams.length >= 2) {
                        statTeams = group.teams;
                        break;
                    }
                }
            }
            const directStatTeams = !Array.isArray(summary?.statistics) && Array.isArray(summary?.statistics?.teams)
                ? summary.statistics.teams
                : [];
            const formatTeams = summary?.format?.teams ?? [];
            const teams = boxTeams.length >= 2 ? boxTeams :
                statTeams.length >= 2 ? statTeams :
                    directStatTeams.length >= 2 ? directStatTeams :
                        formatTeams.length >= 2 ? formatTeams :
                            [];
            if (teams.length < 2) {
                this.logger.warn(`📊 parseEspnMatchStats: sin datos (box=${boxTeams.length}, stat=${statTeams.length}, direct=${directStatTeams.length})`);
                return null;
            }
            const home = teams.find((t) => t.homeAway === 'home') ?? teams[0];
            const away = teams.find((t) => t.homeAway === 'away') ?? teams[1];
            const extractStat = (teamData, statName) => {
                const stats = teamData?.statistics ?? [];
                const found = stats.find((s) => s.name?.toLowerCase().includes(statName.toLowerCase()) ||
                    s.label?.toLowerCase().includes(statName.toLowerCase()));
                return found ? (parseFloat(found.value ?? found.displayValue) || null) : null;
            };
            const possession = (teamData) => {
                const stats = teamData?.statistics ?? [];
                const p = stats.find((s) => s.name === 'possessionPct' || s.label?.toLowerCase().includes('possession'));
                return p ? parseFloat(p.displayValue ?? p.value) || null : null;
            };
            return {
                homeTeam: home?.team?.displayName ?? '',
                awayTeam: away?.team?.displayName ?? '',
                possession: {
                    home: possession(home),
                    away: possession(away),
                },
                shotsOnTarget: {
                    home: extractStat(home, 'shotsOnTarget') ?? extractStat(home, 'shot on target'),
                    away: extractStat(away, 'shotsOnTarget') ?? extractStat(away, 'shot on target'),
                },
                totalShots: {
                    home: extractStat(home, 'totalShots') ?? extractStat(home, 'shots'),
                    away: extractStat(away, 'totalShots') ?? extractStat(away, 'shots'),
                },
                fouls: {
                    home: extractStat(home, 'fouls') ?? extractStat(home, 'foul'),
                    away: extractStat(away, 'fouls') ?? extractStat(away, 'foul'),
                },
                yellowCards: {
                    home: extractStat(home, 'yellowCard') ?? extractStat(home, 'yellow'),
                    away: extractStat(away, 'yellowCard') ?? extractStat(away, 'yellow'),
                },
                redCards: {
                    home: extractStat(home, 'redCard') ?? extractStat(home, 'red'),
                    away: extractStat(away, 'redCard') ?? extractStat(away, 'red'),
                },
                corners: {
                    home: extractStat(home, 'cornerKick') ?? extractStat(home, 'corner'),
                    away: extractStat(away, 'cornerKick') ?? extractStat(away, 'corner'),
                },
                saves: {
                    home: extractStat(home, 'saves') ?? extractStat(home, 'save'),
                    away: extractStat(away, 'saves') ?? extractStat(away, 'save'),
                },
                offsides: {
                    home: extractStat(home, 'offside'),
                    away: extractStat(away, 'offside'),
                },
            };
        }
        catch {
            return null;
        }
    }
    parseEspnSummaryEvents(summary) {
        const events = [];
        const normalizeTeam = (t) => /river plate/i.test(t) ? RIVER_CANON : t;
        for (const sp of (summary.scoringPlays ?? [])) {
            const typeText = (sp.type?.text ?? '').toLowerCase();
            let type = 'goal';
            if (typeText.includes('own'))
                type = 'own-goal';
            else if (typeText.includes('penalty'))
                type = 'penalty-goal';
            const minuteStr = sp.clock?.displayValue ?? '0';
            const minute = parseInt(minuteStr.replace("'", ''), 10) || 0;
            events.push({
                type, minute,
                team: normalizeTeam(sp.team?.displayName ?? ''),
                playerName: sp.participants?.[0]?.athlete?.displayName ?? sp.text ?? null,
                playerInName: null,
                assistName: sp.participants?.[1]?.athlete?.displayName ?? null,
                detail: null,
                period: sp.period?.number ?? 1,
            });
        }
        const scoringPlayMinutes = new Set(events.map(e => `${e.minute}-${e.period}`));
        for (const ke of (summary.keyEvents ?? [])) {
            const typeText = (ke.type?.text ?? ke.text ?? '').toLowerCase();
            const clock = ke.clock?.displayValue ?? ke.time?.displayValue ?? '0';
            const minute = parseInt(clock.replace("'", ''), 10) || 0;
            const team = normalizeTeam(ke.team?.displayName ?? '');
            const player = ke.participants?.[0]?.athlete?.displayName ?? null;
            const period = ke.period?.number ?? 1;
            if (typeText.includes('yellow card') || typeText.includes('tarjeta amarilla')) {
                events.push({ type: 'yellow-card', minute, team, playerName: player, playerInName: null, assistName: null, detail: null, period });
            }
            else if (typeText.includes('red card') || typeText.includes('tarjeta roja')) {
                events.push({ type: 'red-card', minute, team, playerName: player, playerInName: null, assistName: null, detail: null, period });
            }
            else if (typeText.includes('substitution') || typeText.includes('sustituci')) {
                events.push({
                    type: 'substitution', minute, team, playerName: player,
                    playerInName: ke.participants?.[1]?.athlete?.displayName ?? null,
                    assistName: null, detail: null, period,
                });
            }
            else if (typeText.includes('var') || typeText.includes('video review')) {
                events.push({
                    type: 'var', minute, team, playerName: player,
                    playerInName: null, assistName: null, detail: ke.text ?? null, period,
                });
            }
            else if ((typeText.includes('goal') || typeText.includes('gol') || typeText.includes('score')) &&
                !typeText.includes('yellow') && !typeText.includes('red') &&
                !scoringPlayMinutes.has(`${minute}-${period}`)) {
                let type = 'goal';
                if (typeText.includes('own') || typeText.includes('propia') || typeText.includes('contra'))
                    type = 'own-goal';
                else if (typeText.includes('penalty') || typeText.includes('penal'))
                    type = 'penalty-goal';
                events.push({ type, minute, team, playerName: player, playerInName: null, assistName: null, detail: null, period });
            }
        }
        events.sort((a, b) => a.period - b.period || a.minute - b.minute);
        return events;
    }
    async syncMatches() {
        if (this.syncInProgress) {
            this.logger.warn('⏳ Sync ya en progreso, saltando esta ejecución.');
            return;
        }
        this.syncInProgress = true;
        try {
            this.logger.log('🔄 Sincronizando fixture River Plate...');
            let matches = [];
            if (!matches.length) {
                this.logger.log('📡 [1/4] ESPN API...');
                matches = await this.fetchFromEspnApi();
                this.logger.log(matches.length ? `✅ ESPN: ${matches.length} partidos.` : '❌ ESPN: 0 partidos.');
            }
            if (!matches.length) {
                this.logger.log('📡 [2/4] TheSportsDB...');
                matches = await this.fetchFromTheSportsDB();
                this.logger.log(matches.length ? `✅ TheSportsDB: ${matches.length} partidos.` : '❌ TheSportsDB: 0 partidos.');
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
            this.logger.log(`📊 Total tras dedup: ${deduped.length} partidos ` +
                `(scheduled: ${deduped.filter(m => m.status === 'scheduled').length}, ` +
                `finished: ${deduped.filter(m => m.status === 'finished').length})`);
            await this.saveToDatabase(deduped);
        }
        catch (error) {
            this.logger.error(`❌ Error crítico: ${error?.message}`);
        }
        finally {
            this.syncInProgress = false;
        }
    }
    async resolveTheSportsDbId() {
        if (this.sportsDbTeamId)
            return this.sportsDbTeamId;
        try {
            const url = 'https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=River+Plate';
            const res = await axios_1.default.get(url, { headers: AXIOS_HEADERS, timeout: 10000 });
            const teams = res.data?.teams || [];
            this.logger.log(`TheSportsDB búsqueda "River Plate": ${teams.length} resultados`);
            for (const t of teams) {
                const country = (t.strCountry || '').toLowerCase();
                const league = (t.strLeague || '').toLowerCase();
                const name = (t.strTeam || '').toLowerCase();
                this.logger.log(`  → ${t.strTeam} | País: ${t.strCountry} | Liga: ${t.strLeague} | ID: ${t.idTeam}`);
                const isArgentina = country.includes('argentina') ||
                    league.includes('primera') ||
                    league.includes('argentina');
                if (isArgentina && name.includes('river plate')) {
                    this.sportsDbTeamId = t.idTeam;
                    this.logger.log(`✅ TheSportsDB ID encontrado: ${this.sportsDbTeamId} (${t.strTeam} - ${t.strCountry})`);
                    return this.sportsDbTeamId;
                }
            }
            this.logger.warn('⚠️ TheSportsDB: no se encontró River Plate Argentina.');
        }
        catch (e) {
            this.logger.warn(`⚠️ TheSportsDB discovery falló: ${e?.message}`);
        }
        return null;
    }
    async fetchFromTheSportsDB() {
        const teamId = await this.resolveTheSportsDbId();
        if (!teamId) {
            this.logger.warn('⚠️ TheSportsDB: no se pudo resolver el team ID.');
            return [];
        }
        const allMatches = [];
        for (const [endpoint, key] of [
            ['eventsnext.php', 'events'],
            ['eventslast.php', 'results'],
        ]) {
            try {
                const url = `https://www.thesportsdb.com/api/v1/json/3/${endpoint}?id=${teamId}`;
                const res = await axios_1.default.get(url, { headers: AXIOS_HEADERS, timeout: 10000 });
                const events = res.data?.[key] || [];
                for (const ev of events) {
                    const homeTeamRaw = ev.strHomeTeam || '';
                    const awayTeamRaw = ev.strAwayTeam || '';
                    const homeScoreRaw = ev.intHomeScore != null ? parseInt(ev.intHomeScore, 10) : null;
                    const awayScoreRaw = ev.intAwayScore != null ? parseInt(ev.intAwayScore, 10) : null;
                    const statusRaw = (ev.strStatus || '').toLowerCase();
                    let status = 'scheduled';
                    if (['match finished', 'ft', 'aet', 'pen', 'finished'].includes(statusRaw)) {
                        status = 'finished';
                    }
                    else if (statusRaw.includes('live') || statusRaw.includes('progress')) {
                        status = 'live';
                    }
                    else if (homeScoreRaw !== null && awayScoreRaw !== null) {
                        status = 'finished';
                    }
                    const dateStr = ev.dateEvent || null;
                    const timeStr = ev.strTime || '20:00:00';
                    const date = dateStr
                        ? new Date(`${dateStr}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}`)
                        : new Date();
                    const normalized = normalizeTeams(homeTeamRaw, awayTeamRaw, homeScoreRaw, awayScoreRaw);
                    if (!isRiver(normalized.homeTeam) && !isRiver(normalized.awayTeam)) {
                        this.logger.warn(`⚠️ Partido descartado (no involucra River): ${homeTeamRaw} vs ${awayTeamRaw}`);
                        continue;
                    }
                    const tiedScore = homeScoreRaw !== null && awayScoreRaw !== null && homeScoreRaw === awayScoreRaw;
                    const penStatusRaw = (ev.strStatus || '').toLowerCase();
                    const isPenResult = penStatusRaw === 'pen' || penStatusRaw === 'aet';
                    let penaltyWinner = null;
                    if (status === 'finished' && tiedScore && isPenResult) {
                        const homePen = ev.intHomeScorePenalty != null ? parseInt(ev.intHomeScorePenalty, 10) : null;
                        const awayPen = ev.intAwayScorePenalty != null ? parseInt(ev.intAwayScorePenalty, 10) : null;
                        if (homePen != null && awayPen != null) {
                            penaltyWinner = homePen > awayPen ? homeTeamRaw : awayTeamRaw;
                        }
                        else if (ev.strResult) {
                            const resultLower = (ev.strResult || '').toLowerCase();
                            const homeLower = homeTeamRaw.toLowerCase();
                            const awayLower = awayTeamRaw.toLowerCase();
                            if (resultLower.includes(homeLower))
                                penaltyWinner = homeTeamRaw;
                            else if (resultLower.includes(awayLower))
                                penaltyWinner = awayTeamRaw;
                        }
                    }
                    allMatches.push({
                        ...normalized,
                        status,
                        date,
                        penaltyWinner,
                        competition: ev.strLeague || ev.strSeason || 'Competición',
                    });
                }
            }
            catch (e) {
                this.logger.warn(`⚠️ TheSportsDB [${endpoint}] falló: ${e?.message}`);
            }
        }
        return allMatches;
    }
    async resolveEspnTeamId() {
        if (this.espnTeamId)
            return this.espnTeamId;
        try {
            const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/teams?limit=100';
            const res = await axios_1.default.get(url, { headers: AXIOS_HEADERS, timeout: 10000 });
            const sportsArr = res.data?.sports || [];
            let teams = [];
            if (sportsArr.length > 0) {
                teams = sportsArr[0]?.leagues?.[0]?.teams || [];
            }
            else {
                teams = res.data?.teams || [];
            }
            this.logger.log(`ESPN equipos en arg.1: ${teams.length}`);
            for (const entry of teams) {
                const t = entry.team || entry;
                const name = (t.displayName || t.name || '').toLowerCase();
                this.logger.log(`  → ${t.displayName} | ID: ${t.id}`);
                if (name.includes('river plate') || name === 'river') {
                    this.espnTeamId = String(t.id);
                    this.logger.log(`✅ ESPN team ID encontrado: ${this.espnTeamId} (${t.displayName})`);
                    return this.espnTeamId;
                }
            }
            this.logger.warn('⚠️ ESPN: River Plate no encontrado en la lista de arg.1');
        }
        catch (e) {
            this.logger.warn(`⚠️ ESPN discovery falló: ${e?.message}`);
        }
        return null;
    }
    mapEspnStatus(statusName) {
        const finishedStates = [
            'STATUS_FINAL', 'STATUS_FULL_TIME', 'STATUS_POSTPONED', 'STATUS_CANCELED',
            'STATUS_FINAL_PEN', 'STATUS_FINAL_AET', 'STATUS_FINAL_PEN_AET',
        ];
        const liveStates = ['STATUS_IN_PROGRESS', 'STATUS_HALFTIME', 'STATUS_FIRST_HALF', 'STATUS_SECOND_HALF'];
        if (finishedStates.includes(statusName))
            return 'finished';
        if (liveStates.includes(statusName))
            return 'live';
        return 'scheduled';
    }
    extractScore(scoreField) {
        if (scoreField == null)
            return null;
        if (typeof scoreField === 'number')
            return scoreField;
        if (typeof scoreField === 'string') {
            const n = parseInt(scoreField, 10);
            return Number.isNaN(n) ? null : n;
        }
        if (typeof scoreField === 'object') {
            const candidate = scoreField.value ?? scoreField.displayValue;
            if (candidate == null)
                return null;
            const n = parseInt(String(candidate), 10);
            return Number.isNaN(n) ? null : n;
        }
        return null;
    }
    async fetchFromEspnApi() {
        const teamId = await this.resolveEspnTeamId();
        if (!teamId)
            return [];
        const currentYear = new Date().getFullYear();
        const allMatches = [];
        for (const league of ESPN_LEAGUES) {
            try {
                const eventMap = new Map();
                const seasonsToTry = [currentYear, currentYear - 1, ''];
                for (const season of seasonsToTry) {
                    try {
                        const seasonParam = season !== '' ? `?season=${season}` : '';
                        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}` +
                            `/teams/${teamId}/schedule${seasonParam}`;
                        const res = await axios_1.default.get(url, { headers: AXIOS_HEADERS, timeout: 10000 });
                        const fetched = res.data?.events || [];
                        for (const ev of fetched) {
                            const id = ev.id || `${ev.date}-${league.code}`;
                            if (!eventMap.has(id))
                                eventMap.set(id, ev);
                        }
                    }
                    catch { }
                }
                try {
                    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/teams/${teamId}`;
                    const res = await axios_1.default.get(url, { headers: AXIOS_HEADERS, timeout: 10000 });
                    const nextEvents = res.data?.team?.nextEvent || [];
                    for (const ev of nextEvents) {
                        const id = ev.id || `${ev.date}-${league.code}`;
                        if (!eventMap.has(id))
                            eventMap.set(id, ev);
                    }
                    if (nextEvents.length) {
                        this.logger.log(`ESPN [${league.code}]: +${nextEvents.length} nextEvent(s)`);
                    }
                }
                catch (e) {
                    this.logger.warn(`⚠️ ESPN nextEvent [${league.code}] falló: ${e?.message}`);
                }
                try {
                    const today = new Date();
                    const from = new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000)
                        .toISOString().slice(0, 10).replace(/-/g, '');
                    const to = new Date(today.getTime() + 42 * 24 * 60 * 60 * 1000)
                        .toISOString().slice(0, 10).replace(/-/g, '');
                    const sbUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard?dates=${from}-${to}`;
                    const sbRes = await axios_1.default.get(sbUrl, { headers: AXIOS_HEADERS, timeout: 10000 });
                    for (const ev of sbRes.data?.events ?? []) {
                        const id = String(ev.id || `${ev.date}-${league.code}-sb`);
                        if (!eventMap.has(id))
                            eventMap.set(id, ev);
                    }
                }
                catch { }
                const events = [...eventMap.values()];
                this.logger.log(`ESPN [${league.code}]: ${events.length} eventos totales`);
                for (const event of events) {
                    const comp = event.competitions?.[0];
                    if (!comp)
                        continue;
                    const home = comp.competitors?.find((c) => c.homeAway === 'home');
                    const away = comp.competitors?.find((c) => c.homeAway === 'away');
                    if (!home || !away)
                        continue;
                    const statusName = comp.status?.type?.name || '';
                    const status = this.mapEspnStatus(statusName);
                    const eventDate = new Date(comp.date || event.date || Date.now());
                    const rawHomeScore = status === 'scheduled' ? null : this.extractScore(home.score);
                    const rawAwayScore = status === 'scheduled' ? null : this.extractScore(away.score);
                    const homeWins = home?.winner === true;
                    const awayWins = away?.winner === true;
                    const tiedScore = rawHomeScore !== null && rawAwayScore !== null && rawHomeScore === rawAwayScore;
                    const penaltyWinner = (status === 'finished' && tiedScore && (homeWins || awayWins))
                        ? (homeWins ? (home?.team?.displayName || home?.team?.name || '') : (away?.team?.displayName || away?.team?.name || ''))
                        : null;
                    const normalized = normalizeTeams(home.team?.displayName || home.team?.name || '', away.team?.displayName || away.team?.name || '', rawHomeScore, rawAwayScore);
                    if (!isRiver(normalized.homeTeam) && !isRiver(normalized.awayTeam))
                        continue;
                    const stadium = comp.venue?.fullName ?? comp.venue?.name ?? null;
                    const officials = comp.officials ?? [];
                    const refEntry = officials.find((o) => /referee|ref|árbitro/i.test(o.position?.displayName ?? o.position?.abbreviation ?? ''));
                    const referee = refEntry?.displayName ?? refEntry?.official?.displayName ?? null;
                    const broadcasts = comp.broadcasts ?? comp.geoBroadcasts ?? [];
                    const tvNames = broadcasts.flatMap((b) => b.names ?? b.media?.shortName ? [b.media.shortName] : []);
                    const tvChannel = tvNames.length > 0 ? tvNames.join(' / ') : null;
                    allMatches.push({
                        ...normalized,
                        status,
                        date: eventDate,
                        competition: league.name,
                        minute: comp.status?.displayClock ? parseInt(comp.status.displayClock, 10) || null : null,
                        penaltyWinner,
                        stadium,
                        referee,
                        tvChannel,
                    });
                }
            }
            catch (e) {
                this.logger.warn(`⚠️ ESPN [${league.code}] falló: ${e?.message}`);
            }
        }
        return allMatches;
    }
    async fetchFromApiFootball() {
        const apiKey = process.env.API_FOOTBALL_KEY;
        const teamId = process.env.RIVER_PLATE_TEAM_ID || '26';
        if (!apiKey) {
            this.logger.warn('⚠️ API_FOOTBALL_KEY no configurada. Saltando.');
            return [];
        }
        try {
            const [nextRes, pastRes] = await Promise.all([
                axios_1.default.get(`https://v3.football.api-sports.io/fixtures?team=${teamId}&next=20`, {
                    headers: { 'x-apisports-key': apiKey },
                    timeout: 10000,
                }),
                axios_1.default.get(`https://v3.football.api-sports.io/fixtures?team=${teamId}&last=40`, {
                    headers: { 'x-apisports-key': apiKey },
                    timeout: 10000,
                }),
            ]);
            const raw = [
                ...(nextRes.data?.response || []),
                ...(pastRes.data?.response || []),
            ];
            return raw.map((f) => {
                const short = f.fixture?.status?.short ?? '';
                let status = 'scheduled';
                if (short === 'FT')
                    status = 'finished';
                else if (['1H', '2H', 'HT', 'LIVE'].includes(short))
                    status = 'live';
                const date = new Date(f.fixture?.date || Date.now());
                const normalized = normalizeTeams((f.teams?.home?.name || '').toString(), (f.teams?.away?.name || '').toString(), f.goals?.home ?? null, f.goals?.away ?? null);
                return { ...normalized, status, date, competition: f.league?.name || 'Competición' };
            });
        }
        catch (e) {
            this.logger.warn(`⚠️ API-Football falló: ${e?.message}`);
            return [];
        }
    }
    async fetchFromWikipedia() {
        const currentYear = new Date().getFullYear();
        const pageTitles = [
            `Anexo:Temporada_${currentYear}_del_Club_Atlético_River_Plate`,
            `Club_Atlético_River_Plate_en_${currentYear}`,
        ];
        const allMatches = [];
        for (const title of pageTitles) {
            try {
                const url = `https://es.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content` +
                    `&format=json&titles=${encodeURIComponent(title)}&utf8=1`;
                const res = await axios_1.default.get(url, { headers: AXIOS_HEADERS, timeout: 10000 });
                const pages = res.data?.query?.pages || {};
                const pageId = Object.keys(pages)[0];
                const content = pages[pageId]?.revisions?.[0]?.['*'];
                if (content)
                    allMatches.push(...this.parseWikiContent(content, currentYear));
            }
            catch (e) {
                this.logger.warn(`⚠️ Wikipedia [${title}] falló: ${e?.message}`);
            }
        }
        return allMatches;
    }
    parseWikiContent(content, currentYear) {
        const matches = [];
        const startRegex = /\{\{Ficha de partido/gi;
        let match;
        while ((match = startRegex.exec(content)) !== null) {
            let depth = 0;
            const start = match.index;
            let end = start;
            for (let i = start; i < content.length - 1; i++) {
                if (content[i] === '{' && content[i + 1] === '{') {
                    depth++;
                    i++;
                }
                else if (content[i] === '}' && content[i + 1] === '}') {
                    depth--;
                    if (depth === 0) {
                        end = i + 2;
                        break;
                    }
                    i++;
                }
            }
            if (end <= start)
                continue;
            const block = content.slice(start, end);
            const getValue = (...keys) => {
                for (const key of keys) {
                    const re = new RegExp(`\\|\\s*${key}\\s*=\\s*([^|\\n\\}]+)`, 'i');
                    const m = block.match(re);
                    if (m?.[1])
                        return m[1].trim().replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1').trim();
                }
                return null;
            };
            const homeRaw = getValue('local', 'equipo_local', 'home');
            const awayRaw = getValue('visita', 'visitante', 'away');
            const scoreRaw = getValue('resultado', 'score', 'result');
            const dateRaw = getValue('fecha', 'date');
            const comp = getValue('competicion', 'competencia', 'competition', 'torneo') || 'Torneo Oficial';
            if (!homeRaw || !awayRaw)
                continue;
            if (!isRiver(homeRaw) && !isRiver(awayRaw))
                continue;
            let homeScore = null;
            let awayScore = null;
            let status = 'scheduled';
            if (scoreRaw) {
                const s = scoreRaw.replace(/[\u2013\u2014–—]/g, '-').replace(':', '-');
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
                }
                else {
                    const MONTHS = {
                        enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
                        julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
                    };
                    const parts = dateRaw.split(' de ').map((p) => p.trim().toLowerCase());
                    const day = parseInt(parts[0], 10);
                    const month = MONTHS[parts[1]] ?? 0;
                    const year = parts[2] ? parseInt(parts[2], 10) : currentYear;
                    date = new Date(year, month, isNaN(day) ? 1 : day, 20, 0, 0);
                }
            }
            if (status === 'scheduled' && date < new Date()) {
                status = 'finished';
            }
            const normalized = normalizeTeams(homeRaw, awayRaw, homeScore, awayScore);
            matches.push({ ...normalized, status, date, competition: comp });
        }
        return matches;
    }
    async saveToDatabase(fixtures) {
        if (!fixtures.length) {
            this.logger.warn('⚠️ No hay partidos para guardar.');
            return;
        }
        fixtures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const now = new Date();
        let nextAssigned = false;
        const finished = fixtures.filter(f => f.status === 'finished');
        const latestFinished = finished[finished.length - 1];
        const records = fixtures.map((m, i) => {
            const status = (m.status || 'scheduled').toLowerCase();
            let type;
            if (status === 'live') {
                type = 'LIVE';
            }
            else if (status === 'finished') {
                type = m === latestFinished ? 'LATEST' : `PAST_${i}`;
            }
            else {
                if (!nextAssigned && new Date(m.date) > now) {
                    type = 'NEXT';
                    nextAssigned = true;
                }
                else {
                    type = `FUTURE_${i}`;
                }
            }
            return {
                type,
                homeTeam: m.homeTeam,
                awayTeam: m.awayTeam,
                homeScore: m.homeScore ?? 0,
                awayScore: m.awayScore ?? 0,
                status,
                minute: status === 'live' ? (m.minute ?? 0) : status === 'finished' ? 90 : 0,
                date: new Date(m.date),
                competition: m.competition || 'Competición',
                penaltyWinner: m.penaltyWinner ?? null,
                stadium: m.stadium ?? null,
                referee: m.referee ?? null,
                tvChannel: m.tvChannel ?? null,
                updatedAt: new Date(),
            };
        });
        if (!nextAssigned) {
            const firstScheduled = records.find(r => r.status === 'scheduled');
            if (firstScheduled) {
                firstScheduled.type = 'NEXT';
                this.logger.warn('⚠️ NEXT asignado por fallback.');
            }
        }
        try {
            const existingMatches = await this.prisma.match.findMany({ where: { manualOverride: false } });
            for (const record of records) {
                let match = existingMatches.find(m => m.homeTeam === record.homeTeam &&
                    m.awayTeam === record.awayTeam &&
                    Math.abs(m.date.getTime() - record.date.getTime()) < 1000 * 60 * 60 * 48);
                if (!match) {
                    match = existingMatches.find(m => m.type === record.type);
                }
                if (match) {
                    const wasFinished = match.status === 'finished';
                    const isNowFinished = record.status === 'finished';
                    const justFinished = !wasFinished && isNowFinished;
                    const updatedMatch = await this.prisma.match.update({
                        where: { id: match.id },
                        data: record,
                    });
                    if (justFinished) {
                        this.logger.log(`⚽ Partido finalizado detectado: ${updatedMatch.homeTeam} vs ${updatedMatch.awayTeam}`);
                        this.predictionsService.resolvePredictions(updatedMatch.id, updatedMatch.homeScore ?? 0, updatedMatch.awayScore ?? 0)
                            .catch(e => this.logger.error('Error resolviendo predicciones:', e));
                        this.autoSyncEventsForMatch(updatedMatch.id, updatedMatch.homeTeam, updatedMatch.awayTeam, updatedMatch.date)
                            .catch(e => this.logger.warn(`Auto-sync events falló: ${e?.message}`));
                    }
                }
                else {
                    const newMatch = await this.prisma.match.upsert({
                        where: { type: record.type },
                        update: record,
                        create: record,
                    });
                    if (record.status === 'finished') {
                        const hasEvents = await this.prisma.matchEvent.count({ where: { matchId: newMatch.id } });
                        if (hasEvents === 0) {
                            this.autoSyncEventsForMatch(newMatch.id, newMatch.homeTeam, newMatch.awayTeam, newMatch.date)
                                .catch(e => this.logger.warn(`Auto-sync events (new) falló: ${e?.message}`));
                        }
                    }
                }
            }
            this.logger.log(`🎉 Sincronizados ${fixtures.length} partidos de forma segura.`);
        }
        catch (err) {
            this.logger.error(`❌ Error guardando en BD: ${err?.message}`);
        }
    }
    getFallbackFixture() {
        const y = new Date().getFullYear();
        return [
            { homeTeam: RIVER_CANON, awayTeam: 'Independiente', homeScore: 2, awayScore: 0, status: 'finished', date: new Date(`${y}-04-12T20:00:00`), competition: 'Liga Profesional' },
            { homeTeam: 'Boca Juniors', awayTeam: RIVER_CANON, homeScore: 1, awayScore: 1, status: 'finished', date: new Date(`${y}-04-19T20:00:00`), competition: 'Liga Profesional' },
            { homeTeam: RIVER_CANON, awayTeam: 'San Lorenzo', homeScore: null, awayScore: null, status: 'scheduled', date: new Date(`${y}-05-10T20:00:00`), competition: 'Liga Profesional' },
            { homeTeam: RIVER_CANON, awayTeam: 'Carabobo FC', homeScore: null, awayScore: null, status: 'scheduled', date: new Date(`${y}-05-14T19:00:00`), competition: 'Copa Sudamericana' },
            { homeTeam: 'Racing Club', awayTeam: RIVER_CANON, homeScore: null, awayScore: null, status: 'scheduled', date: new Date(`${y}-05-17T20:00:00`), competition: 'Liga Profesional' },
        ];
    }
};
exports.MatchesService = MatchesService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MatchesService.prototype, "handleCron", null);
exports.MatchesService = MatchesService = MatchesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        predictions_service_1.PredictionsService])
], MatchesService);
//# sourceMappingURL=matches.service.js.map
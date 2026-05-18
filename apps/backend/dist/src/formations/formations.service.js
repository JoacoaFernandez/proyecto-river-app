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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormationsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const prisma_service_1 = require("../prisma/prisma.service");
const SUPPORTED_SCHEMES = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2'];
const POSITION_TO_ROLE = {
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
const CACHE_TTL = 12 * 60 * 60 * 1000;
const RIVER_RX = /river\s*plate/i;
const ESPN_POS_MAP = {
    G: 'GK', GK: 'GK',
    D: 'DEF', CB: 'DEF', LB: 'DEF', RB: 'DEF', WB: 'DEF', SW: 'DEF',
    M: 'MID', CM: 'MID', CAM: 'MID', CDM: 'MID', LM: 'MID', RM: 'MID', DM: 'MID',
    F: 'ATK', LW: 'ATK', RW: 'ATK', CF: 'ATK', SS: 'ATK', FW: 'ATK',
};
let FormationsService = class FormationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    baseCache = null;
    async create(createFormationDto) {
        const { matchId } = createFormationDto;
        const match = await this.prisma.match.findUnique({ where: { id: matchId } });
        if (!match)
            throw new common_1.NotFoundException(`El partido con ID ${matchId} no existe.`);
        return this.prisma.formation.create({ data: createFormationDto });
    }
    async findAll() {
        return this.prisma.formation.findMany({ include: { match: true } });
    }
    async findOne(id) {
        const formation = await this.prisma.formation.findUnique({ where: { id }, include: { match: true } });
        if (!formation)
            throw new common_1.NotFoundException(`La formación con ID ${id} no existe.`);
        return formation;
    }
    async getForMatch(matchId) {
        return this.prisma.formation.findUnique({ where: { matchId } });
    }
    async upsertForMatch(matchId, data) {
        const match = await this.prisma.match.findUnique({ where: { id: matchId } });
        if (!match)
            throw new common_1.NotFoundException(`Partido ${matchId} no encontrado.`);
        return this.prisma.formation.upsert({
            where: { matchId },
            update: { scheme: data.scheme, type: data.type, lineup: data.lineup },
            create: { matchId, scheme: data.scheme, type: data.type, lineup: data.lineup, isLineup: true },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.formation.delete({ where: { id } });
    }
    async getLineup(rawScheme, forceRefresh = false) {
        const scheme = SUPPORTED_SCHEMES.includes(rawScheme ?? '') ? rawScheme : '4-3-3';
        const slots = this.computeSlots(scheme);
        if (forceRefresh)
            this.baseCache = null;
        const base = await this.buildBaseData();
        const allPlayers = await this.prisma.player.findMany({
            orderBy: [{ number: 'asc' }, { name: 'asc' }],
        });
        const pools = { GK: [], DEF: [], MID: [], ATK: [] };
        for (const p of allPlayers) {
            const role = POSITION_TO_ROLE[p.position];
            if (!role)
                continue;
            if (base.starterIds.size > 0) {
                if (base.starterIds.has(p.id))
                    pools[role].unshift(p);
                else
                    pools[role].push(p);
            }
            else {
                pools[role].push(p);
            }
        }
        const virtualPools = { GK: [], DEF: [], MID: [], ATK: [] };
        for (const v of base.virtualStarters)
            virtualPools[v.role].push(v);
        const used = new Set();
        const lineup = slots.map((slot) => {
            const dbPool = pools[slot.role] ?? [];
            const dbPlayer = dbPool.find((p) => !used.has(p.id));
            if (dbPlayer) {
                used.add(dbPlayer.id);
                return { ...slot, player: this.toLineupPlayer(dbPlayer) };
            }
            const vPool = virtualPools[slot.role];
            const virtual = vPool.shift();
            if (virtual)
                return { ...slot, player: this.toVirtualPlayer(virtual) };
            return { ...slot, player: null };
        });
        const bench = allPlayers
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
    async buildBaseData() {
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
        const data = {
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
    async fetchLastMatchLineup(allPlayers) {
        try {
            const now = new Date();
            const from = new Date(now);
            from.setDate(from.getDate() - 45);
            const dateRange = `${this.fmtDate(from)}-${this.fmtDate(now)}`;
            const scoreboardResults = await Promise.allSettled(ESPN_LEAGUES.map((league) => axios_1.default.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${dateRange}`, { headers: ESPN_HEADERS, timeout: 8000 }).then((r) => ({ league, events: r.data?.events ?? [] }))));
            const candidates = [];
            for (const result of scoreboardResults) {
                if (result.status !== 'fulfilled')
                    continue;
                const { league, events } = result.value;
                for (const event of events) {
                    const comp = event.competitions?.[0];
                    if (!comp)
                        continue;
                    const status = comp.status?.type?.name ?? comp.status?.type?.state ?? '';
                    if (!['STATUS_FINAL', 'STATUS_FULL_TIME', 'completed', 'post'].some((s) => status.toLowerCase().includes(s.toLowerCase())))
                        continue;
                    const competitors = comp.competitors ?? [];
                    const hasRiver = competitors.some((c) => RIVER_RX.test(c.team?.displayName ?? c.team?.name ?? ''));
                    if (!hasRiver)
                        continue;
                    const rival = competitors.find((c) => !RIVER_RX.test(c.team?.displayName ?? c.team?.name ?? ''));
                    candidates.push({
                        league,
                        eventId: event.id,
                        date: new Date(event.date ?? comp.date),
                        opponent: rival?.team?.displayName ?? rival?.team?.name ?? 'Rival',
                        competition: event.season?.type?.name ?? event.name ?? league,
                    });
                }
            }
            if (candidates.length === 0)
                return null;
            candidates.sort((a, b) => b.date.getTime() - a.date.getTime());
            const latest = candidates[0];
            const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/${latest.league}/summary?event=${latest.eventId}`;
            const summaryRes = await axios_1.default.get(summaryUrl, { headers: ESPN_HEADERS, timeout: 8000 });
            const summary = summaryRes.data;
            const riverRoster = this.extractRiverRoster(summary);
            if (!riverRoster || riverRoster.length === 0)
                return null;
            const starterIds = new Set();
            const virtualStarters = [];
            for (const espnPlayer of riverRoster) {
                const dbMatch = this.matchEspnPlayerToDb(espnPlayer.name, espnPlayer.jersey, allPlayers);
                if (dbMatch) {
                    starterIds.add(dbMatch.id);
                }
                else {
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
        }
        catch (e) {
            console.error('FormationsService ESPN error:', e?.message);
            return null;
        }
    }
    extractRiverRoster(summary) {
        const rosters = summary?.rosters ?? [];
        for (const teamRoster of rosters) {
            const teamName = teamRoster?.team?.displayName ?? teamRoster?.team?.name ?? '';
            if (!RIVER_RX.test(teamName))
                continue;
            const entries = teamRoster?.roster ?? teamRoster?.athletes ?? [];
            const starters = this.parseRosterEntries(entries);
            if (starters.length > 0)
                return starters;
        }
        const bsPlayers = summary?.boxscore?.players ?? [];
        for (const teamData of bsPlayers) {
            const teamName = teamData?.team?.displayName ?? teamData?.team?.name ?? '';
            if (!RIVER_RX.test(teamName))
                continue;
            const entries = teamData?.athletes ?? teamData?.statistics ?? [];
            const starters = this.parseRosterEntries(entries);
            if (starters.length > 0)
                return starters;
        }
        return null;
    }
    parseRosterEntries(entries) {
        const result = [];
        for (const entry of entries) {
            const athlete = entry?.athlete ?? entry;
            const name = athlete?.displayName ?? athlete?.shortName ?? athlete?.fullName ?? '';
            if (!name)
                continue;
            const jersey = athlete?.jersey != null ? parseInt(String(athlete.jersey), 10) : null;
            const posAbbr = (athlete?.position?.abbreviation ?? athlete?.position ?? '').toUpperCase();
            const isStarter = entry?.starter === true ||
                entry?.starter === 'true' ||
                entry?.startsAtPosition != null ||
                entry?.period === 1;
            result.push({ name, jersey: isNaN(jersey) ? null : jersey, posAbbr, starter: isStarter });
        }
        const markedStarters = result.filter((p) => p.starter);
        if (markedStarters.length >= 7)
            return markedStarters.slice(0, 11);
        return result.slice(0, 11);
    }
    matchEspnPlayerToDb(name, jersey, players) {
        if (jersey != null) {
            const byJersey = players.find((p) => p.number === jersey);
            if (byJersey)
                return byJersey;
        }
        return this.fuzzyMatchPlayer(name, players);
    }
    fuzzyMatchPlayer(name, players) {
        const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
        const n = norm(name);
        let match = players.find((p) => norm(p.name) === n);
        if (match)
            return match;
        const lastName = n.split(' ').pop() ?? n;
        match = players.find((p) => norm(p.name).split(' ').pop() === lastName);
        if (match)
            return match;
        const parts = n.split(' ');
        if (parts.length >= 2) {
            const first = parts[0];
            const last = parts[parts.length - 1];
            match = players.find((p) => {
                const pp = norm(p.name).split(' ');
                return pp[0] === first && pp[pp.length - 1] === last;
            });
            if (match)
                return match;
        }
        return null;
    }
    espnPositionToRole(abbr) {
        return ESPN_POS_MAP[abbr] ?? 'MID';
    }
    async detectInjuryAlerts(players) {
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
            const alerts = [];
            const alreadyAlerted = new Set();
            for (const article of news) {
                const text = `${article.title} ${article.body}`;
                for (const p of players) {
                    if (alreadyAlerted.has(p.id))
                        continue;
                    const lastName = p.name.split(' ').pop() ?? p.name;
                    if (!new RegExp(lastName, 'i').test(text))
                        continue;
                    if (injuryRx.test(text)) {
                        alerts.push({ playerId: p.id, type: 'injury', detail: `${p.name} — posible baja por lesión` });
                        alreadyAlerted.add(p.id);
                    }
                    else if (suspRx.test(text)) {
                        alerts.push({ playerId: p.id, type: 'suspension', detail: `${p.name} — posible baja por suspensión` });
                        alreadyAlerted.add(p.id);
                    }
                }
            }
            return alerts;
        }
        catch {
            return [];
        }
    }
    toLineupPlayer(p) {
        return { id: p.id, name: p.name, number: p.number, photo: p.photo, nationality: p.nationality, position: p.position };
    }
    toVirtualPlayer(v) {
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
    fmtDate(d) {
        return d.toISOString().slice(0, 10).replace(/-/g, '');
    }
    computeSlots(scheme) {
        const lines = scheme.split('-').map((n) => parseInt(n, 10));
        const slots = [];
        slots.push({ x: 50, y: 92, role: 'GK' });
        const yDef = 70;
        const yAtk = 18;
        const lineCount = lines.length;
        for (let li = 0; li < lineCount; li++) {
            const t = lineCount === 1 ? 0.5 : li / (lineCount - 1);
            const y = yDef - t * (yDef - yAtk);
            const role = li === 0 ? 'DEF' : li === lineCount - 1 ? 'ATK' : 'MID';
            const playersInLine = lines[li];
            for (let pi = 0; pi < playersInLine; pi++) {
                const x = ((pi + 1) * 100) / (playersInLine + 1);
                slots.push({ x, y, role });
            }
        }
        return slots;
    }
};
exports.FormationsService = FormationsService;
exports.FormationsService = FormationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FormationsService);
//# sourceMappingURL=formations.service.js.map
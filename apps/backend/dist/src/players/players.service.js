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
var PlayersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayersService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const axios_1 = __importDefault(require("axios"));
const prisma_service_1 = require("../prisma/prisma.service");
const API_HEADERS = () => ({
    'x-rapidapi-key': process.env.API_FOOTBALL_KEY ?? '',
    'x-rapidapi-host': 'v3.football.api-sports.io',
});
const RIVER_TEAM_IDS = [268, 435];
let PlayersService = PlayersService_1 = class PlayersService {
    prisma;
    logger = new common_1.Logger(PlayersService_1.name);
    statsCache = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
    }
    async create(createPlayerDto) {
        return this.prisma.player.create({
            data: createPlayerDto,
        });
    }
    async findAll() {
        return this.prisma.player.findMany({
            orderBy: {
                number: 'asc',
            },
        });
    }
    async findOne(id) {
        const player = await this.prisma.player.findUnique({
            where: { id },
        });
        if (!player) {
            throw new common_1.NotFoundException(`Jugador con ID ${id} no encontrado`);
        }
        return player;
    }
    async update(id, updatePlayerDto) {
        await this.findOne(id);
        return this.prisma.player.update({
            where: { id },
            data: updatePlayerDto,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.player.delete({
            where: { id },
        });
    }
    leaderboardCache = null;
    async getLeaderboard() {
        if (this.leaderboardCache && Date.now() - this.leaderboardCache.ts < 3_600_000) {
            return this.leaderboardCache.data;
        }
        const [players, espnMap] = await Promise.all([
            this.prisma.player.findMany({ orderBy: { number: 'asc' } }),
            this.fetchEspnRoster(),
        ]);
        const data = players
            .map((p) => {
            const espn = this.matchEspnPlayer(espnMap, p.name);
            return {
                id: p.id,
                name: p.name,
                position: p.position,
                number: p.number,
                photo: p.photo,
                goals: espn?.goals ?? 0,
                assists: espn?.assists ?? 0,
                appearances: espn?.appearances ?? 0,
                season: 2026,
            };
        })
            .filter((e) => e.appearances > 0 || e.goals > 0)
            .sort((a, b) => b.goals - a.goals || b.assists - a.assists);
        this.leaderboardCache = { data, ts: Date.now() };
        return data;
    }
    async getInjuriesRaw() {
        const results = {};
        for (const season of [2025, 2024]) {
            for (const teamId of RIVER_TEAM_IDS) {
                try {
                    const res = await axios_1.default.get('https://v3.football.api-sports.io/injuries', {
                        params: { team: teamId, season },
                        headers: API_HEADERS(),
                        timeout: 15000,
                    });
                    results[`team${teamId}_season${season}`] = {
                        total: res.data?.results,
                        sample: (res.data?.response ?? []).slice(0, 3),
                    };
                }
                catch (e) {
                    results[`team${teamId}_season${season}`] = { error: e.message };
                }
            }
        }
        return results;
    }
    async syncInjuries() {
        if (!process.env.API_FOOTBALL_KEY)
            return { synced: 0, injured: 0 };
        const injuryMap = new Map();
        for (const season of [2025, 2024]) {
            for (const teamId of RIVER_TEAM_IDS) {
                try {
                    const res = await axios_1.default.get('https://v3.football.api-sports.io/injuries', {
                        params: { team: teamId, season },
                        headers: API_HEADERS(),
                        timeout: 15000,
                    });
                    this.logger.log(`Injuries API team=${teamId} season=${season}: ${res.data?.results ?? 0} entries`);
                    for (const entry of res.data?.response ?? []) {
                        const fixtureDate = entry.fixture?.date ? new Date(entry.fixture.date) : null;
                        if (!fixtureDate)
                            continue;
                        const apiId = String(entry.player?.id ?? '');
                        if (!apiId)
                            continue;
                        const existing = injuryMap.get(apiId);
                        if (!existing || fixtureDate > existing.fixtureDate) {
                            injuryMap.set(apiId, {
                                type: entry.player?.type ?? 'Lesión',
                                zone: entry.player?.reason ?? '',
                                fixtureDate,
                            });
                        }
                    }
                }
                catch (e) {
                    this.logger.warn(`Injury fetch failed for team ${teamId} season ${season}: ${e.message}`);
                }
            }
        }
        const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const recentlyInjuredIds = new Set([...injuryMap.entries()]
            .filter(([, v]) => v.fixtureDate >= cutoff)
            .map(([id]) => id));
        this.logger.log(`Found ${injuryMap.size} total injury records, ${recentlyInjuredIds.size} within last 90 days`);
        const players = await this.prisma.player.findMany();
        let injured = 0;
        for (const player of players) {
            const apiId = player.photo?.split('/').pop()?.replace('.png', '') ?? '';
            const details = injuryMap.get(apiId);
            const isRecentlyInjured = recentlyInjuredIds.has(apiId);
            if (isRecentlyInjured && details) {
                await this.prisma.player.update({
                    where: { id: player.id },
                    data: {
                        status: 'injured',
                        injuryType: details.type,
                        injuryZone: details.zone || null,
                    },
                });
                this.logger.log(`  → Lesionado: ${player.name} (${details.type})`);
                injured++;
            }
            else if (player.status === 'injured') {
                await this.prisma.player.update({
                    where: { id: player.id },
                    data: { status: 'available', injuryType: null, injuryZone: null, injuryReturnDate: null },
                });
            }
        }
        this.logger.log(`Injuries synced: ${injured} lesionados de ${players.length} jugadores`);
        return { synced: players.length, injured };
    }
    espnRosterCache = null;
    async fetchEspnRoster() {
        if (this.espnRosterCache && Date.now() - this.espnRosterCache.ts < 6 * 3_600_000) {
            return this.espnRosterCache.data;
        }
        const nameStats = new Map();
        const athleteIds = new Map();
        const ensure = (name) => {
            const key = name.toLowerCase();
            if (!nameStats.has(key))
                nameStats.set(key, { fullName: name, appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, saves: 0 });
            return nameStats.get(key);
        };
        try {
            const LEAGUES = ['arg.1', 'conmebol.sudamericana'];
            const now = Date.now();
            const allSchedules = await Promise.all(LEAGUES.map((league) => axios_1.default
                .get(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/16/schedule?season=2026`, { timeout: 15000 })
                .then((r) => ({ league, events: r.data?.events ?? [] }))
                .catch(() => ({ league, events: [] }))));
            const seenIds = new Set();
            const leagueEventIds = [];
            for (const { league, events } of allSchedules) {
                for (const e of events) {
                    if (e.id && new Date(e.date).getTime() < now && !seenIds.has(e.id)) {
                        seenIds.add(e.id);
                        leagueEventIds.push({ league, eid: e.id });
                    }
                }
            }
            this.logger.log(`ESPN: ${leagueEventIds.length} partidos completados (arg.1 + sudamericana 2026)`);
            await Promise.all(leagueEventIds.map(async ({ league, eid }) => {
                try {
                    const res = await axios_1.default.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${eid}`, { timeout: 10000 });
                    const data = res.data ?? {};
                    for (const teamRoster of data.rosters ?? []) {
                        if (teamRoster.team?.id !== '16')
                            continue;
                        for (const entry of teamRoster.roster ?? []) {
                            const name = entry.athlete?.displayName ?? '';
                            const aid = String(entry.athlete?.id ?? '');
                            if (!name)
                                continue;
                            ensure(name).appearances++;
                            if (aid && !athleteIds.has(aid))
                                athleteIds.set(aid, name);
                        }
                    }
                }
                catch (e) {
                    this.logger.warn(`ESPN summary ${eid} falló: ${e.message}`);
                }
            }));
        }
        catch (e) {
            this.logger.warn(`ESPN schedule fetch falló: ${e.message}`);
        }
        this.logger.log(`ESPN: ${athleteIds.size} atletas únicos encontrados, obteniendo stats individuales...`);
        const G_IDX = 5, A_IDX = 6, YC_IDX = 3, RC_IDX = 4;
        await Promise.all([...athleteIds.entries()].map(async ([aid, displayName]) => {
            try {
                const res = await axios_1.default.get(`https://site.web.api.espn.com/apis/common/v3/sports/soccer/athletes/${aid}/overview`, { timeout: 10000 });
                const splits = res.data?.statistics?.splits ?? [];
                let goals = 0, assists = 0, yellowCards = 0, redCards = 0;
                for (const split of splits) {
                    if (!String(split.displayName ?? '').includes('2026'))
                        continue;
                    const s = split.stats ?? [];
                    goals += Number(s[G_IDX]) || 0;
                    assists += Number(s[A_IDX]) || 0;
                    yellowCards += Number(s[YC_IDX]) || 0;
                    redCards += Number(s[RC_IDX]) || 0;
                }
                const entry = ensure(displayName);
                entry.goals = goals;
                entry.assists = assists;
                entry.yellowCards = yellowCards;
                entry.redCards = redCards;
            }
            catch {
            }
        }));
        this.logger.log(`ESPN stats acumuladas: ${nameStats.size} jugadores`);
        if (nameStats.size > 0) {
            const top = [...nameStats.values()].sort((a, b) => b.goals - a.goals).slice(0, 5);
            this.logger.log('Top goleadores: ' + top.map(p => `${p.fullName}(${p.goals})`).join(', '));
        }
        this.espnRosterCache = { data: nameStats, ts: Date.now() };
        return nameStats;
    }
    matchEspnPlayer(espnMap, dbName) {
        const dbLastName = dbName.replace(/^[A-ZÁÉÍÓÚ]\.\s+/, '').toLowerCase().trim();
        for (const [key, stats] of espnMap) {
            const espnLastName = stats.fullName.split(' ').slice(1).join(' ').toLowerCase().trim();
            if (espnLastName === dbLastName || key === dbLastName)
                return stats;
        }
        const dbLastWord = dbLastName.split(' ').pop() ?? '';
        for (const stats of espnMap.values()) {
            const espnLastWord = stats.fullName.split(' ').pop()?.toLowerCase() ?? '';
            if (espnLastWord === dbLastWord && dbLastWord.length > 3)
                return stats;
        }
        return null;
    }
    async getPlayerStats(id) {
        const cached = this.statsCache.get(id);
        if (cached && Date.now() - cached.ts < 600_000)
            return cached.data;
        const player = await this.findOne(id);
        const espnMap = await this.fetchEspnRoster();
        const espn = this.matchEspnPlayer(espnMap, player.name);
        let physical = null;
        const apiId = player.photo?.split('/').pop()?.replace('.png', '') ?? null;
        if (apiId && process.env.API_FOOTBALL_KEY) {
            for (const season of [2024, 2023]) {
                try {
                    const res = await axios_1.default.get('https://v3.football.api-sports.io/players', {
                        params: { id: apiId, season },
                        headers: API_HEADERS(),
                        timeout: 10000,
                    });
                    const entry = res.data?.response?.[0];
                    if (!entry)
                        continue;
                    const p = entry.player ?? {};
                    physical = {
                        height: p.height ?? null,
                        weight: p.weight ?? null,
                        birthDate: p.birth?.date ?? null,
                        birthPlace: p.birth?.place ?? null,
                        birthCountry: p.birth?.country ?? null,
                    };
                    break;
                }
                catch (e) {
                    this.logger.warn(`API-Football físico falló (${apiId}, ${season}): ${e?.message}`);
                }
            }
        }
        if (!espn && !physical) {
            this.statsCache.set(id, { data: null, ts: Date.now() });
            return null;
        }
        const result = {
            height: physical?.height ?? null,
            weight: physical?.weight ?? null,
            birthDate: physical?.birthDate ?? null,
            birthPlace: physical?.birthPlace ?? null,
            birthCountry: physical?.birthCountry ?? null,
            appearances: espn?.appearances ?? 0,
            goals: espn?.goals ?? 0,
            assists: espn?.assists ?? 0,
            yellowCards: espn?.yellowCards ?? 0,
            redCards: espn?.redCards ?? 0,
            lineups: 0,
            minutes: 0,
            rating: null,
            penaltyGoals: 0,
            season: 2026,
        };
        this.statsCache.set(id, { data: result, ts: Date.now() });
        return result;
    }
};
exports.PlayersService = PlayersService;
__decorate([
    (0, schedule_1.Cron)('0 8 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PlayersService.prototype, "syncInjuries", null);
exports.PlayersService = PlayersService = PlayersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlayersService);
//# sourceMappingURL=players.service.js.map
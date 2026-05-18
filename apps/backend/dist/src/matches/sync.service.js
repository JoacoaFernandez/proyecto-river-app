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
var SyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const axios_1 = require("@nestjs/axios");
const prisma_service_1 = require("../prisma/prisma.service");
const rxjs_1 = require("rxjs");
let SyncService = SyncService_1 = class SyncService {
    httpService;
    prisma;
    logger = new common_1.Logger(SyncService_1.name);
    constructor(httpService, prisma) {
        this.httpService = httpService;
        this.prisma = prisma;
    }
    async syncLiveMatch() {
        this.logger.log('Iniciando sincronización automática con API-Football...');
        const apiKey = process.env.API_FOOTBALL_KEY;
        const teamId = process.env.RIVER_PLATE_TEAM_ID || '268';
        if (!apiKey) {
            this.logger.warn('No se encontró la API_FOOTBALL_KEY en las variables de entorno.');
            return;
        }
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`https://v3.football.api-sports.io/fixtures?team=${teamId}&live=all`, {
                headers: { 'x-apisports-key': apiKey },
            }));
            const fixtures = response.data.response;
            if (!fixtures || fixtures.length === 0) {
                this.logger.log('River Plate no está jugando ningún partido en vivo en este momento.');
                return;
            }
            const liveFixture = fixtures[0];
            const homeTeamName = liveFixture.teams.home.name;
            const awayTeamName = liveFixture.teams.away.name;
            const homeGoals = liveFixture.goals.home ?? 0;
            const awayGoals = liveFixture.goals.away ?? 0;
            const elapsedMinute = liveFixture.fixture.status.elapsed ?? 0;
            const matchStatus = liveFixture.fixture.status.short;
            this.logger.log(`¡Partido en vivo detectado! ${homeTeamName} ${homeGoals} - ${awayGoals} ${awayTeamName} (Minuto ${elapsedMinute})`);
            const dbMatch = await this.prisma.match.findFirst({
                where: {
                    OR: [
                        { homeTeam: homeTeamName, status: 'live' },
                        { homeTeam: homeTeamName, status: 'scheduled' },
                        { awayTeam: awayTeamName, status: 'live' },
                        { awayTeam: awayTeamName, status: 'scheduled' }
                    ]
                },
            });
            if (!dbMatch) {
                this.logger.warn('El partido en vivo no está registrado en nuestra base de datos. Se omite.');
                return;
            }
            let newStatus = 'live';
            if (matchStatus === 'FT') {
                newStatus = 'finished';
            }
            await this.prisma.match.update({
                where: { id: dbMatch.id },
                data: {
                    homeScore: homeGoals,
                    awayScore: awayGoals,
                    minute: elapsedMinute,
                    status: newStatus,
                },
            });
            this.logger.log(`Base de datos de Render sincronizada para el partido: ${dbMatch.id}`);
            if (newStatus === 'finished' && dbMatch.status !== 'finished') {
                await this.resolvePredictions(dbMatch.id, homeGoals, awayGoals);
            }
        }
        catch (error) {
            this.logger.error('Error al sincronizar con API-Football:', error.message);
        }
    }
    async resolvePredictions(matchId, homeGoals, awayGoals) {
        this.logger.log(`Resolviendo predicciones para el partido ${matchId}...`);
        let result = 'draw';
        if (homeGoals > awayGoals)
            result = 'home';
        else if (awayGoals > homeGoals)
            result = 'away';
        const pendingPredictions = await this.prisma.prediction.findMany({
            where: { matchId, status: 'pending' },
        });
        for (const pred of pendingPredictions) {
            const isWinner = pred.choice === result;
            const newStatus = isWinner ? 'won' : 'lost';
            await this.prisma.prediction.update({
                where: { id: pred.id },
                data: { status: newStatus },
            });
            if (isWinner) {
                await this.prisma.user.update({
                    where: { id: pred.userId },
                    data: { points: { increment: 10 } },
                });
            }
        }
        this.logger.log(`Predicciones resueltas: ${pendingPredictions.length} procesadas.`);
    }
};
exports.SyncService = SyncService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncService.prototype, "syncLiveMatch", null);
exports.SyncService = SyncService = SyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        prisma_service_1.PrismaService])
], SyncService);
//# sourceMappingURL=sync.service.js.map
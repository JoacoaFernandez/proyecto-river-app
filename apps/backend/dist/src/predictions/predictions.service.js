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
var PredictionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PredictionsService = PredictionsService_1 = class PredictionsService {
    prisma;
    logger = new common_1.Logger(PredictionsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        await this.resolveAllPending();
    }
    async createOrUpdate(userId, matchId, choice) {
        if (!['home', 'draw', 'away'].includes(choice)) {
            throw new common_1.BadRequestException('Elección inválida');
        }
        const match = await this.prisma.match.findUnique({ where: { id: matchId } });
        if (!match) {
            throw new common_1.NotFoundException('Partido no encontrado');
        }
        if (match.status !== 'scheduled' && match.status !== 'NS') {
            throw new common_1.BadRequestException('No puedes predecir un partido que ya comenzó o finalizó');
        }
        const prediction = await this.prisma.prediction.upsert({
            where: {
                userId_matchId: { userId, matchId },
            },
            update: { choice },
            create: {
                userId,
                matchId,
                choice,
            },
        });
        return prediction;
    }
    async getMyPrediction(userId, matchId) {
        return this.prisma.prediction.findUnique({
            where: {
                userId_matchId: { userId, matchId },
            },
        });
    }
    async getMyAllPredictions(userId) {
        return this.prisma.prediction.findMany({
            where: { userId },
            include: { match: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getRanking() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                display_name: true,
                avatar_url: true,
                points: true,
            },
            orderBy: { points: 'desc' },
            take: 100,
        });
    }
    async getSummary(matchId) {
        const rows = await this.prisma.prediction.groupBy({
            by: ['choice'],
            where: { matchId },
            _count: { choice: true },
        });
        const counts = { home: 0, draw: 0, away: 0 };
        for (const r of rows)
            counts[r.choice] = r._count.choice;
        const total = counts.home + counts.draw + counts.away;
        const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0;
        return {
            home: counts.home,
            draw: counts.draw,
            away: counts.away,
            total,
            homePct: pct(counts.home),
            drawPct: pct(counts.draw),
            awayPct: pct(counts.away),
        };
    }
    async resolvePredictions(matchId, homeScore, awayScore) {
        const actualResult = homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw';
        const predictions = await this.prisma.prediction.findMany({
            where: { matchId, status: 'pending' },
        });
        for (const p of predictions) {
            const won = p.choice === actualResult;
            await this.prisma.prediction.update({
                where: { id: p.id },
                data: { status: won ? 'won' : 'lost' },
            });
            if (won) {
                await this.prisma.user.update({
                    where: { id: p.userId },
                    data: { points: { increment: 10 } },
                });
            }
        }
        return predictions.length;
    }
    async resolveAllPending() {
        const finishedMatches = await this.prisma.match.findMany({
            where: {
                status: 'finished',
                homeScore: { not: null },
                awayScore: { not: null },
                predictions: { some: { status: 'pending' } },
            },
            select: { id: true, homeScore: true, awayScore: true, homeTeam: true, awayTeam: true },
        });
        if (finishedMatches.length === 0)
            return;
        this.logger.log(`Resolviendo predicciones pendientes para ${finishedMatches.length} partido(s) finalizado(s)...`);
        for (const m of finishedMatches) {
            const count = await this.resolvePredictions(m.id, m.homeScore, m.awayScore);
            this.logger.log(`  ✅ ${m.homeTeam} vs ${m.awayTeam}: ${count} predicción(es) resuelta(s)`);
        }
    }
};
exports.PredictionsService = PredictionsService;
exports.PredictionsService = PredictionsService = PredictionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PredictionsService);
//# sourceMappingURL=predictions.service.js.map
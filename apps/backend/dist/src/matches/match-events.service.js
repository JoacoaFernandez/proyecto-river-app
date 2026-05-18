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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchEventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const GOAL_TYPES = ['goal', 'own-goal', 'penalty-goal'];
let MatchEventsService = class MatchEventsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByMatch(matchId) {
        return this.prisma.matchEvent.findMany({
            where: { matchId },
            orderBy: [{ period: 'asc' }, { minute: 'asc' }, { createdAt: 'asc' }],
        });
    }
    async create(matchId, dto) {
        const match = await this.prisma.match.findUnique({ where: { id: matchId } });
        if (!match)
            throw new common_1.NotFoundException(`Match ${matchId} not found`);
        const event = await this.prisma.matchEvent.create({
            data: {
                matchId,
                type: dto.type,
                minute: dto.minute,
                team: dto.team,
                playerName: dto.playerName ?? null,
                playerInName: dto.playerInName ?? null,
                assistName: dto.assistName ?? null,
                detail: dto.detail ?? null,
                period: dto.period ?? 1,
            },
        });
        if (GOAL_TYPES.includes(dto.type)) {
            await this.recalculateScore(matchId);
        }
        return event;
    }
    async update(eventId, dto) {
        const existing = await this.prisma.matchEvent.findUnique({ where: { id: eventId } });
        if (!existing)
            throw new common_1.NotFoundException(`Event ${eventId} not found`);
        const updated = await this.prisma.matchEvent.update({
            where: { id: eventId },
            data: {
                ...(dto.type !== undefined && { type: dto.type }),
                ...(dto.minute !== undefined && { minute: dto.minute }),
                ...(dto.team !== undefined && { team: dto.team }),
                ...(dto.playerName !== undefined && { playerName: dto.playerName }),
                ...(dto.playerInName !== undefined && { playerInName: dto.playerInName }),
                ...(dto.assistName !== undefined && { assistName: dto.assistName }),
                ...(dto.detail !== undefined && { detail: dto.detail }),
                ...(dto.period !== undefined && { period: dto.period }),
            },
        });
        if (GOAL_TYPES.includes(existing.type) || GOAL_TYPES.includes(dto.type ?? '')) {
            await this.recalculateScore(existing.matchId);
        }
        return updated;
    }
    async remove(eventId) {
        const existing = await this.prisma.matchEvent.findUnique({ where: { id: eventId } });
        if (!existing)
            throw new common_1.NotFoundException(`Event ${eventId} not found`);
        await this.prisma.matchEvent.delete({ where: { id: eventId } });
        if (GOAL_TYPES.includes(existing.type)) {
            await this.recalculateScore(existing.matchId);
        }
        return { deleted: true };
    }
    async recalculateScore(matchId) {
        const match = await this.prisma.match.findUnique({ where: { id: matchId } });
        if (!match)
            return;
        const goals = await this.prisma.matchEvent.findMany({
            where: { matchId, type: { in: GOAL_TYPES } },
        });
        let homeScore = 0;
        let awayScore = 0;
        for (const g of goals) {
            const isHomeTeamGoal = g.team.toLowerCase().includes(match.homeTeam.toLowerCase()) ||
                match.homeTeam.toLowerCase().includes(g.team.toLowerCase());
            if (g.type === 'own-goal') {
                if (isHomeTeamGoal)
                    awayScore++;
                else
                    homeScore++;
            }
            else {
                if (isHomeTeamGoal)
                    homeScore++;
                else
                    awayScore++;
            }
        }
        await this.prisma.match.update({
            where: { id: matchId },
            data: { homeScore, awayScore },
        });
    }
};
exports.MatchEventsService = MatchEventsService;
exports.MatchEventsService = MatchEventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MatchEventsService);
//# sourceMappingURL=match-events.service.js.map
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
exports.SurveysService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SurveysService = class SurveysService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.survey.findMany({
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { votes: true } } },
        });
    }
    async findActive() {
        return this.prisma.survey.findFirst({
            where: { active: true },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { votes: true } } },
        });
    }
    async getResults(id) {
        const survey = await this.prisma.survey.findUnique({ where: { id } });
        if (!survey)
            throw new common_1.NotFoundException('Encuesta no encontrada');
        const votes = await this.prisma.surveyVote.groupBy({
            by: ['optionId'],
            where: { surveyId: id },
            _count: { optionId: true },
        });
        const total = votes.reduce((sum, v) => sum + v._count.optionId, 0);
        const options = survey.options.map((opt) => {
            const found = votes.find((v) => v.optionId === opt.id);
            const count = found?._count.optionId ?? 0;
            return { ...opt, count, percent: total > 0 ? Math.round((count / total) * 100) : 0 };
        });
        return { id: survey.id, question: survey.question, active: survey.active, total, options };
    }
    async getUserVote(surveyId, userId) {
        return this.prisma.surveyVote.findUnique({
            where: { surveyId_userId: { surveyId, userId } },
        });
    }
    async vote(surveyId, userId, optionId) {
        const survey = await this.prisma.survey.findUnique({ where: { id: surveyId } });
        if (!survey)
            throw new common_1.NotFoundException('Encuesta no encontrada');
        if (!survey.active)
            throw new common_1.ForbiddenException('La encuesta está cerrada');
        const options = survey.options;
        if (!options.find((o) => o.id === optionId)) {
            throw new common_1.NotFoundException('Opción inválida');
        }
        const existing = await this.prisma.surveyVote.findUnique({
            where: { surveyId_userId: { surveyId, userId } },
        });
        if (existing)
            throw new common_1.ConflictException('Ya votaste en esta encuesta');
        return this.prisma.surveyVote.create({
            data: { surveyId, userId, optionId },
        });
    }
    async create(data) {
        return this.prisma.survey.create({
            data: { question: data.question, options: data.options },
        });
    }
    async close(id) {
        return this.prisma.survey.update({
            where: { id },
            data: { active: false, closedAt: new Date() },
        });
    }
    async remove(id) {
        return this.prisma.survey.delete({ where: { id } });
    }
};
exports.SurveysService = SurveysService;
exports.SurveysService = SurveysService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SurveysService);
//# sourceMappingURL=surveys.service.js.map
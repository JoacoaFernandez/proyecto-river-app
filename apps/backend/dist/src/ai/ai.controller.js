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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const prisma_service_1 = require("../prisma/prisma.service");
let AiController = class AiController {
    aiService;
    prisma;
    constructor(aiService, prisma) {
        this.aiService = aiService;
        this.prisma = prisma;
    }
    async getPrediction(matchId) {
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
            select: { aiPrediction: true, homeTeam: true, awayTeam: true },
        });
        if (!match) {
            throw new common_1.NotFoundException('Partido no encontrado');
        }
        const predictionStale = match.aiPrediction &&
            (!match.aiPrediction.toLowerCase().includes(match.homeTeam.toLowerCase()) ||
                !match.aiPrediction.toLowerCase().includes(match.awayTeam.toLowerCase()));
        if (match.aiPrediction && !predictionStale) {
            return { prediction: match.aiPrediction };
        }
        if (predictionStale) {
            await this.prisma.match.update({
                where: { id: matchId },
                data: { aiPrediction: null },
            });
        }
        const prediction = await this.aiService.predictMatch(matchId);
        if (!prediction) {
            return { prediction: 'No se pudo generar la predicción en este momento. Inténtalo más tarde.' };
        }
        return { prediction };
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Get)('prediction/:matchId'),
    __param(0, (0, common_1.Param)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getPrediction", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_service_1.AiService,
        prisma_service_1.PrismaService])
], AiController);
//# sourceMappingURL=ai.controller.js.map
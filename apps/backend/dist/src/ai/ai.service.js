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
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const generative_ai_1 = require("@google/generative-ai");
const prisma_service_1 = require("../prisma/prisma.service");
let AiService = AiService_1 = class AiService {
    prisma;
    configService;
    genAI;
    logger = new common_1.Logger(AiService_1.name);
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        const apiKey = this.configService.get('GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
            this.logger.log('✨ AiService: Google Generative AI inicializado correctamente.');
        }
        else {
            this.logger.warn('❌ AiService: GEMINI_API_KEY no encontrada en las variables de entorno.');
        }
    }
    async predictMatch(matchId) {
        if (!this.genAI) {
            this.logger.error('No se puede generar predicción: genAI no está inicializado.');
            return null;
        }
        this.logger.log(`🤖 Generando predicción para el partido ${matchId}...`);
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
        });
        if (!match)
            return null;
        const h2h = await this.prisma.match.findMany({
            where: {
                OR: [
                    { homeTeam: match.homeTeam, awayTeam: match.awayTeam },
                    { homeTeam: match.awayTeam, awayTeam: match.homeTeam },
                ],
                status: 'finished',
            },
            orderBy: { date: 'desc' },
            take: 5,
        });
        const h2hContext = h2h.length > 0
            ? h2h.map(m => `- ${m.date.toISOString().split('T')[0]}: ${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam}`).join('\n')
            : 'No hay enfrentamientos recientes registrados.';
        const prompt = `
Eres "El Oráculo Millonario", un bot experto en estadísticas y análisis táctico de River Plate.
Tu tarea es predecir el resultado del próximo partido y dar un análisis breve.

PARTIDO: ${match.homeTeam} vs ${match.awayTeam}
COMPETICIÓN: ${match.competition || 'No especificada'}
ESTADIO: ${match.stadium || 'No especificado'}

HISTORIAL RECIENTE (H2H):
${h2hContext}

INSTRUCCIONES:
1. Da una predicción de resultado exacto (Ej: ${match.homeTeam} 2 - 1 ${match.awayTeam}).
2. Explica brevemente (2 párrafos) por qué predices ese resultado basado en el historial y la mística del club.
3. Menciona qué jugador o zona del campo tiene más chances de ser determinante.
4. Usa un tono apasionado pero analítico.
5. Devuelve la respuesta EXCLUSIVAMENTE en formato Markdown.
6. No incluyas saludos ni despedidas fuera del análisis.
`;
        const modelNames = [
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-1.5-flash-8b',
            'gemini-1.5-pro',
            'gemini-flash-latest',
        ];
        for (const modelName of modelNames) {
            try {
                this.logger.log(`📡 Intentando con modelo: ${modelName}`);
                const model = this.genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();
                await this.prisma.match.update({
                    where: { id: matchId },
                    data: { aiPrediction: text },
                });
                this.logger.log(`✅ Predicción generada exitosamente con ${modelName}`);
                return text;
            }
            catch (error) {
                this.logger.warn(`⚠️ Modelo ${modelName} falló: ${error.message}`);
            }
        }
        this.logger.error('❌ Todos los modelos fallaron al generar la predicción.');
        return null;
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log('✨ AiService: Google Generative AI inicializado correctamente.');
    } else {
      this.logger.warn('❌ AiService: GEMINI_API_KEY no encontrada en las variables de entorno.');
    }
  }

  async predictMatch(matchId: string) {
    if (!this.genAI) {
      this.logger.error('No se puede generar predicción: genAI no está inicializado.');
      return null;
    }

    this.logger.log(`🤖 Generando predicción para el partido ${matchId}...`);

    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) return null;

    // Obtener historial H2H (últimos 5 partidos)
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

    // Intentar con modelos en orden de preferencia
    const modelNames = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];

    for (const modelName of modelNames) {
      try {
        this.logger.log(`📡 Intentando con modelo: ${modelName}`);
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Guardar en la base de datos
        await this.prisma.match.update({
          where: { id: matchId },
          data: { aiPrediction: text },
        });

        this.logger.log(`✅ Predicción generada exitosamente con ${modelName}`);
        return text;
      } catch (error) {
        this.logger.warn(`⚠️ Modelo ${modelName} falló: ${error.message}`);
      }
    }

    this.logger.error('❌ Todos los modelos fallaron al generar la predicción.');
    return null;
  }
}

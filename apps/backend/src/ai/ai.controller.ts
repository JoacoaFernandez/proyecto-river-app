import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('prediction/:matchId')
  async getPrediction(@Param('matchId') matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      select: { aiPrediction: true },
    });

    if (!match) {
      throw new NotFoundException('Partido no encontrado');
    }

    if (match.aiPrediction) {
      return { prediction: match.aiPrediction };
    }

    const prediction = await this.aiService.predictMatch(matchId);
    if (!prediction) {
      return { prediction: 'No se pudo generar la predicción en este momento. Inténtalo más tarde.' };
    }

    return { prediction };
  }
}

import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class AiController {
    private readonly aiService;
    private readonly prisma;
    constructor(aiService: AiService, prisma: PrismaService);
    getPrediction(matchId: string): Promise<{
        prediction: string;
    }>;
}

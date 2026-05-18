import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class AiService {
    private prisma;
    private configService;
    private genAI;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService);
    predictMatch(matchId: string): Promise<string | null>;
}

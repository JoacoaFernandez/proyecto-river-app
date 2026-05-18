import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export declare class NewsAiService implements OnModuleInit {
    private readonly prisma;
    private readonly logger;
    private readonly parser;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    private generateSlug;
    handleCron(): Promise<void>;
    generateAndSaveNews(): Promise<void>;
}

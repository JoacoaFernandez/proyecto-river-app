import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
interface PushPayload {
    title: string;
    body: string;
    link?: string;
    icon?: string | null;
}
export declare class PushService implements OnModuleInit {
    private prisma;
    private config;
    private readonly logger;
    private enabled;
    constructor(prisma: PrismaService, config: ConfigService);
    onModuleInit(): void;
    getPublicKey(): string;
    saveSubscription(endpoint: string, keys: object, userId?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        keys: import("@prisma/client/runtime/library").JsonValue;
        endpoint: string;
    }>;
    removeSubscription(endpoint: string): Promise<void>;
    sendToAll(payload: PushPayload): Promise<void>;
}
export {};

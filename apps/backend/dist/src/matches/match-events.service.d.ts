import { PrismaService } from '../prisma/prisma.service';
export interface CreateMatchEventDto {
    type: string;
    minute: number;
    team: string;
    playerName?: string;
    playerInName?: string;
    assistName?: string;
    detail?: string;
    period?: number;
}
export declare class MatchEventsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByMatch(matchId: string): Promise<{
        id: string;
        createdAt: Date;
        minute: number;
        type: string;
        matchId: string;
        period: number;
        team: string;
        playerName: string | null;
        playerInName: string | null;
        assistName: string | null;
        detail: string | null;
    }[]>;
    create(matchId: string, dto: CreateMatchEventDto): Promise<{
        id: string;
        createdAt: Date;
        minute: number;
        type: string;
        matchId: string;
        period: number;
        team: string;
        playerName: string | null;
        playerInName: string | null;
        assistName: string | null;
        detail: string | null;
    }>;
    update(eventId: string, dto: Partial<CreateMatchEventDto>): Promise<{
        id: string;
        createdAt: Date;
        minute: number;
        type: string;
        matchId: string;
        period: number;
        team: string;
        playerName: string | null;
        playerInName: string | null;
        assistName: string | null;
        detail: string | null;
    }>;
    remove(eventId: string): Promise<{
        deleted: boolean;
    }>;
    private recalculateScore;
}

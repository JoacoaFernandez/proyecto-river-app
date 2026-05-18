import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export declare class PredictionsService implements OnModuleInit {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    createOrUpdate(userId: string, matchId: string, choice: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        matchId: string;
        choice: string;
    }>;
    getMyPrediction(userId: string, matchId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        matchId: string;
        choice: string;
    } | null>;
    getMyAllPredictions(userId: string): Promise<({
        match: {
            id: string;
            status: string;
            updatedAt: Date;
            homeTeam: string;
            awayTeam: string;
            homeScore: number | null;
            awayScore: number | null;
            minute: number | null;
            competition: string | null;
            season: string | null;
            date: Date;
            type: string;
            manualOverride: boolean;
            stadium: string | null;
            penaltyWinner: string | null;
            aiPrediction: string | null;
            statistics: import("@prisma/client/runtime/library").JsonValue | null;
            photos: import("@prisma/client/runtime/library").JsonValue | null;
            referee: string | null;
            tvChannel: string | null;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        matchId: string;
        choice: string;
    })[]>;
    getRanking(): Promise<{
        id: string;
        display_name: string;
        avatar_url: string | null;
        points: number;
    }[]>;
    getSummary(matchId: string): Promise<{
        home: number;
        draw: number;
        away: number;
        total: number;
        homePct: number;
        drawPct: number;
        awayPct: number;
    }>;
    resolvePredictions(matchId: string, homeScore: number, awayScore: number): Promise<number>;
    resolveAllPending(): Promise<void>;
}

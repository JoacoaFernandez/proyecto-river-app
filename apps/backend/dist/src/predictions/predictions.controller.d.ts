import { PredictionsService } from './predictions.service';
export declare class PredictionsController {
    private readonly predictionsService;
    constructor(predictionsService: PredictionsService);
    createPrediction(req: any, body: {
        matchId: string;
        choice: string;
    }): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        matchId: string;
        choice: string;
    }>;
    getMyPrediction(req: any, matchId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        matchId: string;
        choice: string;
    } | null>;
    getMyAllPredictions(req: any): Promise<({
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
    resolveAll(): Promise<void>;
}

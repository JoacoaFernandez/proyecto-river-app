import { FormationsService } from './formations.service';
import { CreateFormationDto } from './dto/create-formation.dto';
export declare class FormationsController {
    private readonly formationsService;
    constructor(formationsService: FormationsService);
    create(createFormationDto: CreateFormationDto): Promise<{
        id: string;
        type: string;
        matchId: string;
        scheme: string;
        isLineup: boolean;
        lineup: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    lineup(scheme?: string, refresh?: string): Promise<import("./formations.service").LineupResponse>;
    getHistory(limit?: string): Promise<{
        matchId: string;
        date: Date;
        homeTeam: string;
        awayTeam: string;
        homeScore: number | null;
        awayScore: number | null;
        competition: string | null;
        scheme: string;
    }[]>;
    findAll(): Promise<({
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
        type: string;
        matchId: string;
        scheme: string;
        isLineup: boolean;
        lineup: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    findOne(id: string): Promise<{
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
        type: string;
        matchId: string;
        scheme: string;
        isLineup: boolean;
        lineup: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getForMatch(matchId: string): Promise<{
        id: string;
        type: string;
        matchId: string;
        scheme: string;
        isLineup: boolean;
        lineup: import("@prisma/client/runtime/library").JsonValue | null;
    } | null>;
    upsertForMatch(matchId: string, body: {
        scheme: string;
        type: string;
        lineup: any[];
    }): Promise<{
        id: string;
        type: string;
        matchId: string;
        scheme: string;
        isLineup: boolean;
        lineup: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        type: string;
        matchId: string;
        scheme: string;
        isLineup: boolean;
        lineup: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}

import { PrismaService } from '../prisma/prisma.service';
import { CreateFormationDto } from './dto/create-formation.dto';
export type SlotRole = 'GK' | 'DEF' | 'MID' | 'ATK';
export interface PitchSlot {
    x: number;
    y: number;
    role: SlotRole;
}
export interface LineupPlayer {
    id: string;
    name: string;
    number: number | null;
    photo: string | null;
    nationality: string | null;
    position: string;
    virtual?: boolean;
}
export interface LineupEntry extends PitchSlot {
    player: LineupPlayer | null;
}
export interface PlayerAlert {
    playerId: string;
    type: 'injury' | 'suspension';
    detail: string;
    replacementId?: string;
}
export interface LineupResponse {
    scheme: string;
    schemes: string[];
    lineup: LineupEntry[];
    bench: LineupPlayer[];
    source: 'last-match' | 'algorithm';
    lastMatchInfo?: {
        opponent: string;
        date: string;
        competition: string;
    };
    alerts: PlayerAlert[];
}
export declare class FormationsService {
    private prisma;
    constructor(prisma: PrismaService);
    private baseCache;
    create(createFormationDto: CreateFormationDto): Promise<{
        id: string;
        type: string;
        matchId: string;
        scheme: string;
        isLineup: boolean;
        lineup: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
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
    upsertForMatch(matchId: string, data: {
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
    getLineup(rawScheme?: string, forceRefresh?: boolean): Promise<LineupResponse>;
    private buildBaseData;
    private fetchLastMatchLineup;
    private extractRiverRoster;
    private parseRosterEntries;
    private matchEspnPlayerToDb;
    private fuzzyMatchPlayer;
    private espnPositionToRole;
    private detectInjuryAlerts;
    private toLineupPlayer;
    private toVirtualPlayer;
    getHistory(limit?: number): Promise<{
        matchId: string;
        date: Date;
        homeTeam: string;
        awayTeam: string;
        homeScore: number | null;
        awayScore: number | null;
        competition: string | null;
        scheme: string;
    }[]>;
    private fmtDate;
    private computeSlots;
}

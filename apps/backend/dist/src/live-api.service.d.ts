import { MatchesService } from './matches/matches.service';
import { PrismaService } from './prisma/prisma.service';
export interface ScoringPlay {
    team: string;
    scorer: string;
    minute: string;
    period: number;
    type: 'goal' | 'own-goal' | 'penalty';
}
export interface MatchEventPayload {
    id: string;
    type: string;
    minute: number;
    team: string;
    playerName: string | null;
    playerInName: string | null;
    assistName: string | null;
    detail: string | null;
    period: number;
}
export interface MatchStatLine {
    label: string;
    home: string;
    away: string;
    homePct?: number;
}
export interface LiveMatchPayload {
    id: string;
    status: 'pre' | 'in' | 'post';
    displayClock: string;
    period: number;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    competition: string;
    venue: string;
    scoringPlays: ScoringPlay[];
    events: MatchEventPayload[];
    statistics: MatchStatLine[];
}
export declare class LiveApiService {
    private readonly matchesService;
    private readonly prisma;
    private readonly logger;
    private cache;
    private lastFetch;
    constructor(matchesService: MatchesService, prisma: PrismaService);
    getDashboardData(): Promise<any>;
    private fetchStandingsAndStats;
    private computeStatsFromMatches;
    private parseForm;
    invalidateCache(): void;
    private logoCache;
    private logoLastFetch;
    private readonly LOGO_LEAGUES;
    getTeamLogos(): Promise<Record<string, string>>;
    getLiveMatch(): Promise<LiveMatchPayload | null>;
    syncEventsForFinishedMatch(matchId: string, espnEventId: string): Promise<void>;
    private persistEventsForMatch;
    private persistEventsForMatchById;
    private parseLiveMatch;
    private parseEspnStatistics;
    private parseEspnKeyEvents;
}

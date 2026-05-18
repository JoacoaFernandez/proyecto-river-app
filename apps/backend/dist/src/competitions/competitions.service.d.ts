export interface CompetitionMeta {
    code: string;
    name: string;
    shortName: string;
    type: 'league' | 'cup';
    country: string;
    hasStandings: boolean;
}
export declare const COMPETITIONS: CompetitionMeta[];
export interface StandingRow {
    pos: number;
    team: string;
    teamLogo: string | null;
    pj: number;
    pg: number;
    pe: number;
    pp: number;
    gf: number;
    gc: number;
    dif: number;
    pts: number;
    trend?: 'up' | 'down' | 'same';
}
export interface StandingsGroup {
    name: string;
    key: string;
    standings: StandingRow[];
}
export interface PlayoffSeed {
    team: string;
    teamLogo: string | null;
    seed: string;
}
export type PlayoffRound = 'octavos' | 'cuartos' | 'semis' | 'final';
export type PlayoffStatus = 'pending' | 'scheduled' | 'live' | 'finished';
export interface PlayoffMatch {
    round: PlayoffRound;
    slot: number;
    home: PlayoffSeed | null;
    away: PlayoffSeed | null;
    homeScore: number | null;
    awayScore: number | null;
    homePenScore: number | null;
    awayPenScore: number | null;
    status: PlayoffStatus;
    date: string | null;
    winner: 'home' | 'away' | null;
    penaltyDecided: boolean;
}
export interface PlayoffsBracket {
    format: string;
    rounds: {
        octavos: PlayoffMatch[];
        cuartos: PlayoffMatch[];
        semis: PlayoffMatch[];
        final: PlayoffMatch[];
    };
}
export interface StandingsResponse {
    meta: CompetitionMeta;
    groups: StandingsGroup[];
    playoffs: PlayoffsBracket | null;
    lastUpdated: string;
}
export declare class CompetitionsService {
    private readonly logger;
    private standingsCache;
    private playoffsCache;
    private readonly TTL;
    list(): CompetitionMeta[];
    findByCode(code: string): CompetitionMeta;
    getStandings(code: string): Promise<StandingsResponse>;
    private applyTrends;
    private fetchGroups;
    private parseGroup;
    private normalizeGroupLabel;
    private parseEntries;
    private fetchPlayoffMatches;
    private parseRoundFromSeason;
    private mapStatus;
    private parseScore;
    private buildPlayoffsBracket;
    private findEspnMatch;
    private normalize;
    private buildCopaBracket;
    private buildTies;
}

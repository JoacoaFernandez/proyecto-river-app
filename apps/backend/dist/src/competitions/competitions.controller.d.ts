import { CompetitionsService } from './competitions.service';
export declare class CompetitionsController {
    private readonly service;
    constructor(service: CompetitionsService);
    list(): import("./competitions.service").CompetitionMeta[];
    standings(code: string): Promise<import("./competitions.service").StandingsResponse>;
}

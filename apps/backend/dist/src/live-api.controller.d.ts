import { LiveApiService } from './live-api.service';
export declare class LiveApiController {
    private readonly liveApiService;
    constructor(liveApiService: LiveApiService);
    getDashboard(): Promise<any>;
    getTeamLogos(): Promise<Record<string, string>>;
}

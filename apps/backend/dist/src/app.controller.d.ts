import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getNotifications(): Promise<import("./app.service").AppNotification[]>;
}

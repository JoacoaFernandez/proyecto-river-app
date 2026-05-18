import { PushService } from './push.service';
export declare class PushController {
    private readonly pushService;
    constructor(pushService: PushService);
    getPublicKey(): {
        publicKey: string;
    };
    subscribe(body: {
        endpoint: string;
        keys: object;
    }, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        keys: import("@prisma/client/runtime/library").JsonValue;
        endpoint: string;
    }>;
    unsubscribe(body: {
        endpoint: string;
    }): Promise<void>;
}

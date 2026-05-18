import { PrismaService } from './prisma/prisma.service';
export interface AppNotification {
    id: string;
    type: 'news' | 'match_live' | 'match_result' | 'match_upcoming';
    title: string;
    body: string;
    createdAt: string;
    link?: string;
    imageUrl?: string | null;
}
export declare class AppService {
    private prisma;
    constructor(prisma: PrismaService);
    getNotifications(): Promise<AppNotification[]>;
}

import { PrismaService } from '../prisma/prisma.service';
export type FavoriteType = 'player' | 'news' | 'match';
export declare class FavoritesService {
    private prisma;
    constructor(prisma: PrismaService);
    getUserFavorites(userId: string, type?: FavoriteType): Promise<{
        id: string;
        createdAt: Date;
        type: string;
        userId: string;
        targetId: string;
    }[]>;
    isFavorite(userId: string, type: FavoriteType, targetId: string): Promise<{
        isFavorite: boolean;
    }>;
    add(userId: string, type: FavoriteType, targetId: string): Promise<{
        id: string;
        createdAt: Date;
        type: string;
        userId: string;
        targetId: string;
    }>;
    remove(userId: string, type: FavoriteType, targetId: string): Promise<{
        id: string;
        createdAt: Date;
        type: string;
        userId: string;
        targetId: string;
    }>;
    toggle(userId: string, type: FavoriteType, targetId: string): Promise<{
        isFavorite: boolean;
    }>;
}

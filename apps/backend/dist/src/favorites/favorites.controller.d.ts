import { FavoritesService } from './favorites.service';
import type { FavoriteType } from './favorites.service';
export declare class FavoritesController {
    private readonly favoritesService;
    constructor(favoritesService: FavoritesService);
    getMyFavorites(req: any, type?: FavoriteType): Promise<{
        id: string;
        createdAt: Date;
        type: string;
        userId: string;
        targetId: string;
    }[]>;
    check(req: any, type: FavoriteType, targetId: string): Promise<{
        isFavorite: boolean;
    }>;
    toggle(req: any, type: FavoriteType, targetId: string): Promise<{
        isFavorite: boolean;
    }>;
    remove(req: any, type: FavoriteType, targetId: string): Promise<{
        id: string;
        createdAt: Date;
        type: string;
        userId: string;
        targetId: string;
    }>;
}

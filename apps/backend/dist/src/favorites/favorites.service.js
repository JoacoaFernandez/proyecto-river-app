"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoritesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FavoritesService = class FavoritesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserFavorites(userId, type) {
        return this.prisma.favorite.findMany({
            where: { userId, ...(type ? { type } : {}) },
            orderBy: { createdAt: 'desc' },
        });
    }
    async isFavorite(userId, type, targetId) {
        const fav = await this.prisma.favorite.findUnique({
            where: { userId_type_targetId: { userId, type, targetId } },
        });
        return { isFavorite: !!fav };
    }
    async add(userId, type, targetId) {
        try {
            return await this.prisma.favorite.create({
                data: { userId, type, targetId },
            });
        }
        catch {
            throw new common_1.ConflictException('Ya está en favoritos');
        }
    }
    async remove(userId, type, targetId) {
        const fav = await this.prisma.favorite.findUnique({
            where: { userId_type_targetId: { userId, type, targetId } },
        });
        if (!fav)
            throw new common_1.NotFoundException('Favorito no encontrado');
        return this.prisma.favorite.delete({
            where: { userId_type_targetId: { userId, type, targetId } },
        });
    }
    async toggle(userId, type, targetId) {
        const existing = await this.prisma.favorite.findUnique({
            where: { userId_type_targetId: { userId, type, targetId } },
        });
        if (existing) {
            await this.prisma.favorite.delete({
                where: { userId_type_targetId: { userId, type, targetId } },
            });
            return { isFavorite: false };
        }
        await this.prisma.favorite.create({ data: { userId, type, targetId } });
        return { isFavorite: true };
    }
};
exports.FavoritesService = FavoritesService;
exports.FavoritesService = FavoritesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FavoritesService);
//# sourceMappingURL=favorites.service.js.map
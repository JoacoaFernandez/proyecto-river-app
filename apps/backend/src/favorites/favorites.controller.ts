import { Controller, Get, Post, Delete, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FavoritesService } from './favorites.service';
import type { FavoriteType } from './favorites.service';

@ApiTags('Favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Mis favoritos (opcionalmente filtrados por tipo)' })
  async getMyFavorites(@Request() req: any, @Query('type') type?: FavoriteType) {
    return this.favoritesService.getUserFavorites(req.user.id, type);
  }

  @Get(':type/:targetId')
  @ApiOperation({ summary: 'Verificar si un item está en favoritos' })
  async check(
    @Request() req: any,
    @Param('type') type: FavoriteType,
    @Param('targetId') targetId: string,
  ) {
    return this.favoritesService.isFavorite(req.user.id, type, targetId);
  }

  @Post(':type/:targetId')
  @ApiOperation({ summary: 'Toggle favorito (add/remove)' })
  async toggle(
    @Request() req: any,
    @Param('type') type: FavoriteType,
    @Param('targetId') targetId: string,
  ) {
    return this.favoritesService.toggle(req.user.id, type, targetId);
  }

  @Delete(':type/:targetId')
  @ApiOperation({ summary: 'Quitar de favoritos' })
  async remove(
    @Request() req: any,
    @Param('type') type: FavoriteType,
    @Param('targetId') targetId: string,
  ) {
    return this.favoritesService.remove(req.user.id, type, targetId);
  }
}

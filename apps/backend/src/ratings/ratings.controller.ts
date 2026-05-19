import { Body, Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RatingsService } from './ratings.service';

@ApiTags('PlayerRatings')
@Controller('matches/:matchId/ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar ratings de jugadores para un partido (público)' })
  async findByMatch(@Param('matchId') matchId: string) {
    return this.ratingsService.findByMatch(matchId);
  }

  @Put(':playerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear o actualizar rating 1-10 (admin/editor)' })
  async upsert(
    @Param('matchId') matchId: string,
    @Param('playerId') playerId: string,
    @Body() body: { rating: number },
  ) {
    return this.ratingsService.upsert(matchId, playerId, body.rating);
  }

  @Delete(':playerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Borrar rating de un jugador en el partido (admin/editor)' })
  async remove(
    @Param('matchId') matchId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.ratingsService.remove(matchId, playerId);
  }
}

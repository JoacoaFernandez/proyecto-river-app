import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createPrediction(@Request() req, @Body() body: { matchId: string; choice: string }) {
    return this.predictionsService.createOrUpdate(req.user.id, body.matchId, body.choice);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/:matchId')
  getMyPrediction(@Request() req, @Param('matchId') matchId: string) {
    return this.predictionsService.getMyPrediction(req.user.id, matchId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyAllPredictions(@Request() req) {
    return this.predictionsService.getMyAllPredictions(req.user.id);
  }

  @Get('ranking')
  getRanking() {
    return this.predictionsService.getRanking();
  }

  @Get('summary/:matchId')
  getSummary(@Param('matchId') matchId: string) {
    return this.predictionsService.getSummary(matchId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/resolve-all')
  resolveAll() {
    return this.predictionsService.resolveAllPending();
  }
}

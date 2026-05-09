import { Controller, Get, Query } from '@nestjs/common';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('debug')
  async debug() {
    return this.matchesService.getDebugInfo();
  }

  @Get('latest')
  async getLatestMatch() {
    return this.matchesService.getLatestMatch();
  }

  @Get('upcoming')
  async getUpcoming(@Query('limit') limit = '10') {
    const n = parseInt(limit as string, 10) || 10;
    return this.matchesService.getUpcomingMatches(n);
  }

  @Get('past')
  async getPast(@Query('limit') limit = '20') {
    const n = parseInt(limit as string, 10) || 20;
    return this.matchesService.getPastMatches(n);
  }
}
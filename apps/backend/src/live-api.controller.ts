import { Controller, Get } from '@nestjs/common';
import { LiveApiService } from './live-api.service';

@Controller('live')
export class LiveApiController {
  constructor(private readonly liveApiService: LiveApiService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.liveApiService.getDashboardData();
  }

  @Get('team-logos')
  async getTeamLogos() {
    return this.liveApiService.getTeamLogos();
  }
}
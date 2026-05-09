import { Controller, Get } from '@nestjs/common';
import { LiveApiService } from './live-api.service';

@Controller('live') // <- Dejamos esto igual para que el Frontend no se entere de nuestro cambio
export class LiveApiController {
  constructor(private readonly liveApiService: LiveApiService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.liveApiService.getDashboardData();
  }
}
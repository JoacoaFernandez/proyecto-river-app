import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('notifications')
  @ApiOperation({ summary: 'Actividad reciente: noticias, partidos en vivo y resultados' })
  getNotifications() {
    return this.appService.getNotifications();
  }
}

// apps/backend/src/push/push.controller.ts
import { Body, Controller, Delete, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PushService, type PushSegment } from './push.service';

@ApiTags('Push')
@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Get('vapid-public-key')
  @ApiOperation({ summary: 'Obtener la VAPID public key para suscribirse a push' })
  getPublicKey() {
    return { publicKey: this.pushService.getPublicKey() };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Registrar suscripción push del navegador' })
  subscribe(@Body() body: { endpoint: string; keys: object }, @Request() req: any) {
    return this.pushService.saveSubscription(body.endpoint, body.keys, req.user?.id);
  }

  @Delete('unsubscribe')
  @ApiOperation({ summary: 'Eliminar suscripción push del navegador' })
  unsubscribe(@Body() body: { endpoint: string }) {
    return this.pushService.removeSubscription(body.endpoint);
  }

  @Get('segment-count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Contar destinatarios de un segmento (admin)' })
  async segmentCount(@Query('segment') segment: PushSegment) {
    const count = await this.pushService.countSegment(segment ?? 'all');
    return { segment: segment ?? 'all', count };
  }

  @Post('broadcast')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Enviar push masivo a un segmento (admin)' })
  async broadcast(
    @Body() body: { title: string; body: string; link?: string; icon?: string | null; segment?: PushSegment },
  ) {
    return this.pushService.sendToSegment(
      { title: body.title, body: body.body, link: body.link, icon: body.icon },
      body.segment ?? 'all',
    );
  }
}

// apps/backend/src/push/push.controller.ts
import { Body, Controller, Delete, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PushService } from './push.service';

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
}

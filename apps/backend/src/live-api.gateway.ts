// apps/backend/src/live-api.gateway.ts
import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Cron } from '@nestjs/schedule';
import { Server, Socket } from 'socket.io';
import { LiveApiService } from './live-api.service';

@WebSocketGateway({ cors: { origin: '*' }, transports: ['websocket', 'polling'] })
export class LiveApiGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(LiveApiGateway.name);

  constructor(private readonly liveApiService: LiveApiService) {}

  afterInit() {
    this.logger.log('🔌 WebSocket Gateway inicializado');
  }

  async handleConnection(client: Socket) {
    const data = await this.liveApiService.getLiveMatch();
    client.emit('live:update', data);
  }

  @SubscribeMessage('join:live')
  async handleJoinLive(@ConnectedSocket() client: Socket) {
    const data = await this.liveApiService.getLiveMatch();
    client.emit('live:update', data);
  }

  /** Broadcast a todos los clientes cada 30 segundos */
  @Cron('*/30 * * * * *')
  async broadcastLiveMatch() {
    const data = await this.liveApiService.getLiveMatch();
    this.server.emit('live:update', data);
    if (data) {
      this.logger.log(
        `📡 Live: ${data.homeTeam} ${data.homeScore}-${data.awayScore} ${data.awayTeam} (${data.displayClock})`,
      );
    }
  }
}

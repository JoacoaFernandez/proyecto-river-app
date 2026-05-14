// apps/backend/src/live-api.gateway.ts
import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { Cron } from '@nestjs/schedule';
import { Server, Socket } from 'socket.io';
import { LiveApiService } from './live-api.service';
import { PrismaService } from './prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

const BANNED_WORDS = [
  'puto', 'puta', 'concha', 'pelotudo', 'boludo', 'hdp', 'hijo de puta',
  'mierda', 'culo', 'pija', 'choto', 'forro', 'idiota', 'estupido', 'imbecil',
  'negro de mierda', 'la concha', 'la puta', 'carajo',
];
const BANNED_RX = new RegExp(BANNED_WORDS.join('|'), 'i');

function moderateMessage(text: string): string | null {
  if (!text || text.trim().length === 0) return null;
  if (text.length > 300) return null;
  if (BANNED_RX.test(text)) return null;
  return text.trim();
}

@WebSocketGateway({ cors: { origin: '*' }, transports: ['websocket', 'polling'] })
export class LiveApiGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(LiveApiGateway.name);

  constructor(
    private readonly liveApiService: LiveApiService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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

  @SubscribeMessage('chat:join')
  async handleJoinChat(@ConnectedSocket() client: Socket) {
    const match = await this.liveApiService.getLiveMatch();
    if (!match) return;

    client.join(`match_${match.id}`);
    
    // Enviar historial de los últimos 50 mensajes
    const history = await this.prisma.liveChatMessage.findMany({
      where: { matchId: match.id },
      include: { user: { select: { id: true, display_name: true, avatar_url: true } } },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    
    client.emit('chat:history', history);
  }

  @SubscribeMessage('chat:send')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { message: string; token: string }
  ) {
    try {
      const decoded = this.jwtService.verify(payload.token);
      const match = await this.liveApiService.getLiveMatch();

      if (!match) return;

      const safeBody = moderateMessage(payload.message);
      if (!safeBody) {
        client.emit('chat:error', { message: 'Mensaje no permitido.' });
        return;
      }

      const newMsg = await this.prisma.liveChatMessage.create({
        data: {
          body: safeBody,
          matchId: match.id,
          userId: decoded.sub,
        },
        include: {
          user: { select: { id: true, display_name: true, avatar_url: true } },
        },
      });

      this.server.to(`match_${match.id}`).emit('chat:new_message', newMsg);
    } catch (err) {
      this.logger.error('Error enviando mensaje al chat en vivo: ' + err.message);
    }
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

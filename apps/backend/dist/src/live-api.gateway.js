"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var LiveApiGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveApiGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const schedule_1 = require("@nestjs/schedule");
const socket_io_1 = require("socket.io");
const live_api_service_1 = require("./live-api.service");
const prisma_service_1 = require("./prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const BANNED_WORDS = [
    'puto', 'puta', 'concha', 'pelotudo', 'boludo', 'hdp', 'hijo de puta',
    'mierda', 'culo', 'pija', 'choto', 'forro', 'idiota', 'estupido', 'imbecil',
    'negro de mierda', 'la concha', 'la puta', 'carajo',
];
const BANNED_RX = new RegExp(BANNED_WORDS.join('|'), 'i');
function moderateMessage(text) {
    if (!text || text.trim().length === 0)
        return null;
    if (text.length > 300)
        return null;
    if (BANNED_RX.test(text))
        return null;
    return text.trim();
}
let LiveApiGateway = LiveApiGateway_1 = class LiveApiGateway {
    liveApiService;
    prisma;
    jwtService;
    server;
    logger = new common_1.Logger(LiveApiGateway_1.name);
    constructor(liveApiService, prisma, jwtService) {
        this.liveApiService = liveApiService;
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    afterInit() {
        this.logger.log('🔌 WebSocket Gateway inicializado');
    }
    async handleConnection(client) {
        const data = await this.liveApiService.getLiveMatch();
        client.emit('live:update', data);
    }
    async handleJoinLive(client) {
        const data = await this.liveApiService.getLiveMatch();
        client.emit('live:update', data);
    }
    async getLiveDbMatchId() {
        const m = await this.prisma.match.findFirst({
            where: { status: 'live' },
            orderBy: { date: 'desc' },
            select: { id: true },
        });
        return m?.id ?? null;
    }
    async handleJoinChat(client) {
        const espnMatch = await this.liveApiService.getLiveMatch();
        if (!espnMatch)
            return;
        const dbMatchId = await this.getLiveDbMatchId();
        if (!dbMatchId)
            return;
        client.join(`match_${dbMatchId}`);
        const history = await this.prisma.liveChatMessage.findMany({
            where: { matchId: dbMatchId },
            include: { user: { select: { id: true, display_name: true, avatar_url: true } } },
            orderBy: { createdAt: 'asc' },
            take: 50,
        });
        client.emit('chat:history', history);
    }
    async handleChatMessage(client, payload) {
        try {
            const decoded = this.jwtService.verify(payload.token);
            const espnMatch = await this.liveApiService.getLiveMatch();
            if (!espnMatch)
                return;
            const dbMatchId = await this.getLiveDbMatchId();
            if (!dbMatchId)
                return;
            const safeBody = moderateMessage(payload.message);
            if (!safeBody) {
                client.emit('chat:error', { message: 'Mensaje no permitido.' });
                return;
            }
            const newMsg = await this.prisma.liveChatMessage.create({
                data: {
                    body: safeBody,
                    matchId: dbMatchId,
                    userId: decoded.sub,
                },
                include: {
                    user: { select: { id: true, display_name: true, avatar_url: true } },
                },
            });
            this.server.to(`match_${dbMatchId}`).emit('chat:new_message', newMsg);
        }
        catch (err) {
            this.logger.error('Error enviando mensaje al chat en vivo: ' + err.message);
        }
    }
    async broadcastLiveMatch() {
        const data = await this.liveApiService.getLiveMatch();
        this.server.emit('live:update', data);
        if (data) {
            this.logger.log(`📡 Live: ${data.homeTeam} ${data.homeScore}-${data.awayScore} ${data.awayTeam} (${data.displayClock})`);
        }
    }
};
exports.LiveApiGateway = LiveApiGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], LiveApiGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join:live'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], LiveApiGateway.prototype, "handleJoinLive", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], LiveApiGateway.prototype, "handleJoinChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat:send'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], LiveApiGateway.prototype, "handleChatMessage", null);
__decorate([
    (0, schedule_1.Cron)('*/30 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LiveApiGateway.prototype, "broadcastLiveMatch", null);
exports.LiveApiGateway = LiveApiGateway = LiveApiGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' }, transports: ['websocket', 'polling'] }),
    __metadata("design:paramtypes", [live_api_service_1.LiveApiService,
        prisma_service_1.PrismaService,
        jwt_1.JwtService])
], LiveApiGateway);
//# sourceMappingURL=live-api.gateway.js.map
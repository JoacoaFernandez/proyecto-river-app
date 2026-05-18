import { OnGatewayConnection, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveApiService } from './live-api.service';
import { PrismaService } from './prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class LiveApiGateway implements OnGatewayInit, OnGatewayConnection {
    private readonly liveApiService;
    private readonly prisma;
    private readonly jwtService;
    server: Server;
    private readonly logger;
    constructor(liveApiService: LiveApiService, prisma: PrismaService, jwtService: JwtService);
    afterInit(): void;
    handleConnection(client: Socket): Promise<void>;
    handleJoinLive(client: Socket): Promise<void>;
    private getLiveDbMatchId;
    handleJoinChat(client: Socket): Promise<void>;
    handleChatMessage(client: Socket, payload: {
        message: string;
        token: string;
    }): Promise<void>;
    broadcastLiveMatch(): Promise<void>;
}

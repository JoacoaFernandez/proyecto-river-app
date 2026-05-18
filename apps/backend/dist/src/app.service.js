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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma/prisma.service");
let AppService = class AppService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getNotifications() {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const [recentNews, liveMatches, recentResults, upcomingMatches] = await Promise.all([
            this.prisma.news.findMany({
                where: { status: 'published', publishedAt: { gte: since } },
                orderBy: { publishedAt: 'desc' },
                take: 5,
                select: { id: true, title: true, category: true, publishedAt: true, createdAt: true, imageUrl: true },
            }),
            this.prisma.match.findMany({
                where: { status: 'live' },
                take: 3,
            }),
            this.prisma.match.findMany({
                where: { status: 'finished', date: { gte: since } },
                orderBy: { date: 'desc' },
                take: 3,
            }),
            this.prisma.match.findMany({
                where: { status: 'scheduled', date: { lte: tomorrow, gte: new Date() } },
                orderBy: { date: 'asc' },
                take: 2,
            }),
        ]);
        const notifications = [];
        for (const m of liveMatches) {
            notifications.push({
                id: `live-${m.id}`,
                type: 'match_live',
                title: '⚽ Partido en vivo',
                body: `${m.homeTeam} ${m.homeScore ?? 0} - ${m.awayScore ?? 0} ${m.awayTeam}${m.minute ? ` · ${m.minute}'` : ''}`,
                createdAt: m.updatedAt.toISOString(),
                link: '/partidos/en-vivo',
            });
        }
        for (const m of upcomingMatches) {
            const fecha = new Date(m.date).toLocaleString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            notifications.push({
                id: `upcoming-${m.id}`,
                type: 'match_upcoming',
                title: '📅 Próximo partido',
                body: `${m.homeTeam} vs ${m.awayTeam} · ${fecha}`,
                createdAt: m.date.toISOString(),
                link: '/partidos/proximo',
            });
        }
        for (const m of recentResults) {
            const riverHome = /river plate/i.test(m.homeTeam);
            const our = riverHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
            const them = riverHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
            const result = our > them ? 'Victoria' : our < them ? 'Derrota' : 'Empate';
            const emoji = our > them ? '🏆' : our < them ? '😔' : '🤝';
            notifications.push({
                id: `result-${m.id}`,
                type: 'match_result',
                title: `${emoji} ${result}: ${m.homeTeam} ${m.homeScore ?? 0} - ${m.awayScore ?? 0} ${m.awayTeam}`,
                body: m.competition ? `${m.competition} · ${new Date(m.date).toLocaleDateString('es-AR')}` : new Date(m.date).toLocaleDateString('es-AR'),
                createdAt: m.date.toISOString(),
                link: '/partidos',
            });
        }
        for (const n of recentNews) {
            notifications.push({
                id: `news-${n.id}`,
                type: 'news',
                title: n.title,
                body: n.category,
                createdAt: (n.publishedAt ?? n.createdAt).toISOString(),
                link: `/noticias/${n.id}`,
                imageUrl: n.imageUrl,
            });
        }
        return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppService);
//# sourceMappingURL=app.service.js.map
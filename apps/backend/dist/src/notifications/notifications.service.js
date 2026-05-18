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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const RIVER_RX = /river/i;
const LIVE_STATUSES = new Set(['live', 'in_play', 'halftime', 'ht', 'et', 'bt', 'penalty', 'extra_time']);
const FINISHED_STATUSES = new Set(['finished', 'ft', 'aet', 'pen']);
const SCHEDULED_STATUSES = new Set(['scheduled', 'not_started', 'tbd']);
const DATE_FMT = new Intl.DateTimeFormat('es-AR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});
let NotificationsService = class NotificationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAll() {
        const [newsItems, matches] = await Promise.all([
            this.prisma.news.findMany({
                where: { status: 'published' },
                orderBy: { publishedAt: 'desc' },
                take: 8,
                select: { id: true, title: true, category: true, slug: true, imageUrl: true, publishedAt: true, createdAt: true },
            }),
            this.prisma.match.findMany({
                orderBy: { date: 'desc' },
                take: 20,
                select: {
                    id: true, homeTeam: true, awayTeam: true,
                    homeScore: true, awayScore: true,
                    status: true, minute: true, competition: true,
                    date: true, updatedAt: true,
                },
            }),
        ]);
        const notifications = [];
        for (const n of newsItems) {
            notifications.push({
                id: `news-${n.id}`,
                type: 'news',
                title: n.title,
                body: n.category,
                createdAt: (n.publishedAt ?? n.createdAt).toISOString(),
                link: `/noticias/${n.slug}`,
                imageUrl: n.imageUrl,
            });
        }
        for (const m of matches) {
            const isHome = RIVER_RX.test(m.homeTeam);
            const rival = isHome ? m.awayTeam : m.homeTeam;
            const rScore = isHome ? m.homeScore : m.awayScore;
            const oScore = isHome ? m.awayScore : m.homeScore;
            const statusLower = m.status.toLowerCase();
            if (LIVE_STATUSES.has(statusLower)) {
                notifications.push({
                    id: `match-live-${m.id}`,
                    type: 'match_live',
                    title: `¡En vivo! River ${rScore ?? 0} - ${oScore ?? 0} ${rival}`,
                    body: m.minute ? `Min. ${m.minute}` : (m.competition ?? 'Partido en curso'),
                    createdAt: m.updatedAt.toISOString(),
                    link: `/partidos/${m.id}`,
                });
            }
            else if (FINISHED_STATUSES.has(statusLower)) {
                const result = rScore != null && oScore != null
                    ? rScore > oScore ? '✅ Victoria' : rScore < oScore ? '❌ Derrota' : '➡️ Empate'
                    : '';
                notifications.push({
                    id: `match-result-${m.id}`,
                    type: 'match_result',
                    title: `River ${rScore ?? '?'} - ${oScore ?? '?'} ${rival}`,
                    body: [result, m.competition].filter(Boolean).join(' · '),
                    createdAt: m.date.toISOString(),
                    link: `/partidos/${m.id}`,
                });
            }
            else if (SCHEDULED_STATUSES.has(statusLower)) {
                notifications.push({
                    id: `match-upcoming-${m.id}`,
                    type: 'match_upcoming',
                    title: `Próximo: River vs ${rival}`,
                    body: [m.competition, DATE_FMT.format(m.date)].filter(Boolean).join(' · '),
                    createdAt: m.date.toISOString(),
                    link: `/partidos/${m.id}`,
                });
            }
        }
        return notifications
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 20);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map
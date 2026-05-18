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
exports.NewsService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const push_service_1 = require("../push/push.service");
let NewsService = class NewsService {
    prisma;
    push;
    constructor(prisma, push) {
        this.prisma = prisma;
        this.push = push;
    }
    generateSlug(title) {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    async create(createNewsDto) {
        let author = await this.prisma.user.findFirst({
            where: { email: 'periodista.ia@riverapp.com' },
        });
        if (!author) {
            author = await this.prisma.user.create({
                data: {
                    email: 'periodista.ia@riverapp.com',
                    password_hash: '$2b$10$PlaceholderHashForIASystemAccountOnly',
                    display_name: 'Periodista Millonario IA',
                    role: 'ADMIN',
                },
            });
        }
        const slug = createNewsDto.slug || this.generateSlug(createNewsDto.title);
        const slugExists = await this.prisma.news.findUnique({ where: { slug } });
        if (slugExists) {
            throw new common_1.BadRequestException('El slug de la noticia ya está en uso. Elige uno diferente.');
        }
        const status = createNewsDto.status || 'published';
        const publishedAt = status === 'scheduled' && createNewsDto.publishedAt
            ? new Date(createNewsDto.publishedAt)
            : status === 'published'
                ? new Date()
                : null;
        const created = await this.prisma.news.create({
            data: {
                title: createNewsDto.title,
                body: createNewsDto.body,
                category: createNewsDto.category || 'Actualidad',
                status,
                slug,
                imageUrl: createNewsDto.imageUrl || null,
                authorId: createNewsDto.authorId || author.id,
                urgent: createNewsDto.urgent ?? false,
                publishedAt,
            },
        });
        if (createNewsDto.urgent) {
            this.push.sendToAll({
                title: `🚨 URGENTE: ${created.title}`,
                body: created.category,
                link: `/noticias/${created.id}`,
                icon: created.imageUrl ?? undefined,
            }).catch(() => { });
        }
        return created;
    }
    async findAll() {
        return this.prisma.news.findMany({
            orderBy: { publishedAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        display_name: true,
                        avatar_url: true,
                    },
                },
            },
        });
    }
    async findOne(id) {
        const news = await this.prisma.news.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        display_name: true,
                    },
                },
            },
        });
        if (!news) {
            throw new common_1.NotFoundException(`La noticia con ID ${id} no existe.`);
        }
        return news;
    }
    async update(id, updateNewsDto) {
        const existing = await this.findOne(id);
        const dataToUpdate = { ...updateNewsDto };
        if (updateNewsDto.status === 'published' && !updateNewsDto.publishedAt) {
            dataToUpdate.publishedAt = new Date();
        }
        else if (updateNewsDto.status === 'scheduled' && updateNewsDto.publishedAt) {
            dataToUpdate.publishedAt = new Date(updateNewsDto.publishedAt);
        }
        const updated = await this.prisma.news.update({
            where: { id },
            data: dataToUpdate,
        });
        if (updateNewsDto.urgent === true && !existing.urgent) {
            this.push.sendToAll({
                title: `🚨 URGENTE: ${updated.title}`,
                body: updated.category,
                link: `/noticias/${updated.id}`,
                icon: updated.imageUrl,
            }).catch(() => { });
        }
        return updated;
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.news.delete({
            where: { id },
        });
    }
    async getComments(newsId) {
        await this.findOne(newsId);
        return this.prisma.comment.findMany({
            where: { newsId, parentId: null, hidden: false },
            orderBy: { createdAt: 'asc' },
            include: {
                user: { select: { id: true, display_name: true, avatar_url: true } },
                _count: { select: { likes: true } },
                replies: {
                    where: { hidden: false },
                    orderBy: { createdAt: 'asc' },
                    include: {
                        user: { select: { id: true, display_name: true, avatar_url: true } },
                        _count: { select: { likes: true } },
                    },
                },
            },
        });
    }
    async addComment(newsId, userId, body, parentId) {
        await this.findOne(newsId);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.isBanned)
            throw new common_1.ForbiddenException('Tu cuenta está suspendida y no podés comentar.');
        return this.prisma.comment.create({
            data: { newsId, userId, body, parentId: parentId ?? null },
            include: {
                user: { select: { id: true, display_name: true, avatar_url: true } },
                _count: { select: { likes: true } },
                replies: true,
            },
        });
    }
    async removeComment(commentId, userId, userRole) {
        const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment)
            throw new common_1.NotFoundException('Comentario no encontrado.');
        if (comment.userId !== userId && userRole !== 'admin') {
            throw new common_1.ForbiddenException('No podés eliminar este comentario.');
        }
        return this.prisma.comment.delete({ where: { id: commentId } });
    }
    async toggleLike(newsId, userId) {
        await this.findOne(newsId);
        const existing = await this.prisma.newsLike.findUnique({
            where: { newsId_userId: { newsId, userId } },
        });
        if (existing) {
            await this.prisma.newsLike.delete({ where: { newsId_userId: { newsId, userId } } });
        }
        else {
            await this.prisma.newsLike.create({ data: { newsId, userId } });
        }
        const count = await this.prisma.newsLike.count({ where: { newsId } });
        return { liked: !existing, count };
    }
    async getLikeStatus(newsId, userId) {
        const count = await this.prisma.newsLike.count({ where: { newsId } });
        const liked = userId
            ? !!(await this.prisma.newsLike.findUnique({ where: { newsId_userId: { newsId, userId } } }))
            : false;
        return { liked, count };
    }
    async getRelated(newsId, category) {
        return this.prisma.news.findMany({
            where: {
                category,
                id: { not: newsId },
                status: 'published',
            },
            orderBy: { publishedAt: 'desc' },
            take: 4,
            include: {
                author: { select: { id: true, display_name: true, avatar_url: true } },
            },
        });
    }
    async publishScheduled() {
        await this.prisma.news.updateMany({
            where: { status: 'scheduled', publishedAt: { lte: new Date() } },
            data: { status: 'published' },
        });
    }
    async getAllCommentsAdmin() {
        return this.prisma.comment.findMany({
            orderBy: { createdAt: 'desc' },
            take: 200,
            include: {
                user: { select: { id: true, display_name: true, avatar_url: true, isBanned: true } },
                news: { select: { id: true, title: true } },
            },
        });
    }
    async getReportedComments() {
        return this.prisma.comment.findMany({
            where: { reportedAt: { not: null } },
            orderBy: { reportedAt: 'desc' },
            include: {
                user: { select: { id: true, display_name: true, avatar_url: true, isBanned: true } },
                news: { select: { id: true, title: true } },
            },
        });
    }
    async hideComment(commentId) {
        return this.prisma.comment.update({
            where: { id: commentId },
            data: { hidden: true, reportedAt: null },
        });
    }
    async unhideComment(commentId) {
        return this.prisma.comment.update({
            where: { id: commentId },
            data: { hidden: false },
        });
    }
    async dismissReport(commentId) {
        return this.prisma.comment.update({
            where: { id: commentId },
            data: { reportedAt: null },
        });
    }
    async banUser(userId) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { isBanned: true },
            select: { id: true, display_name: true, isBanned: true },
        });
    }
    async unbanUser(userId) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { isBanned: false },
            select: { id: true, display_name: true, isBanned: true },
        });
    }
    async reportComment(commentId) {
        const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment)
            throw new common_1.NotFoundException('Comentario no encontrado.');
        if (comment.reportedAt)
            return comment;
        return this.prisma.comment.update({
            where: { id: commentId },
            data: { reportedAt: new Date() },
        });
    }
    async toggleCommentLike(commentId, userId) {
        const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment)
            throw new common_1.NotFoundException('Comentario no encontrado.');
        const existing = await this.prisma.commentLike.findUnique({
            where: { commentId_userId: { commentId, userId } },
        });
        if (existing) {
            await this.prisma.commentLike.delete({ where: { commentId_userId: { commentId, userId } } });
        }
        else {
            await this.prisma.commentLike.create({ data: { commentId, userId } });
        }
        const count = await this.prisma.commentLike.count({ where: { commentId } });
        return { liked: !existing, count };
    }
};
exports.NewsService = NewsService;
__decorate([
    (0, schedule_1.Cron)('* * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NewsService.prototype, "publishScheduled", null);
exports.NewsService = NewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        push_service_1.PushService])
], NewsService);
//# sourceMappingURL=news.service.js.map
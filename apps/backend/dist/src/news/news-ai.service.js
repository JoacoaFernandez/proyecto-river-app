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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var NewsAiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsAiService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const rss_parser_1 = __importDefault(require("rss-parser"));
let NewsAiService = NewsAiService_1 = class NewsAiService {
    prisma;
    logger = new common_1.Logger(NewsAiService_1.name);
    parser;
    constructor(prisma) {
        this.prisma = prisma;
        this.parser = new rss_parser_1.default({
            customFields: {
                item: [
                    ['media:thumbnail', 'mediaThumbnail'],
                    ['media:content', 'mediaContent'],
                ],
            },
        });
    }
    async onModuleInit() {
        this.logger.log('⚡ [Autónomo] Servidor encendido. Iniciando scraper múltiple con enlaces...');
        setTimeout(async () => {
            await this.generateAndSaveNews();
        }, 5000);
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
    async handleCron() {
        this.logger.log('📰 [CRON] Sincronizando noticias y enlaces originales...');
        await this.generateAndSaveNews();
    }
    async generateAndSaveNews() {
        try {
            let author = await this.prisma.user.findFirst({
                where: { email: 'periodista.ia@riverapp.com' },
            });
            if (!author) {
                author = await this.prisma.user.create({
                    data: {
                        email: 'periodista.ia@riverapp.com',
                        password_hash: '$2b$10$PlaceholderHashForSystemAccountOnly',
                        display_name: 'Prensa Millonaria',
                        role: 'ADMIN',
                    },
                });
            }
            this.logger.log('📡 Conectando con Diario Olé para importar noticias y URLs...');
            const feed = await this.parser.parseURL('https://www.ole.com.ar/rss/river-plate/');
            if (!feed.items || feed.items.length === 0) {
                this.logger.log('🤫 El feed de Olé no tiene artículos disponibles.');
                return;
            }
            let nuevasImportadas = 0;
            for (const item of feed.items) {
                const title = item.title || '';
                const rawBody = item.contentSnippet || item.content || '';
                const body = rawBody.replace(/<[^>]*>/g, '').trim();
                const articleUrl = item.link || null;
                const anyItem = item;
                const imageUrl = item.enclosure?.url ||
                    anyItem.mediaThumbnail?.$.url ||
                    anyItem.mediaContent?.$.url ||
                    (item.content ? (item.content.match(/<img[^>]+src=["']([^"']+)/)?.[1] ?? null) : null) ||
                    null;
                if (!title || !body)
                    continue;
                const generatedSlug = this.generateSlug(title);
                const exists = await this.prisma.news.findUnique({
                    where: { slug: generatedSlug },
                });
                if (exists) {
                    const updates = {};
                    if (!exists.url && articleUrl)
                        updates.url = articleUrl;
                    if (!exists.imageUrl && imageUrl)
                        updates.imageUrl = imageUrl;
                    if (Object.keys(updates).length > 0) {
                        await this.prisma.news.update({ where: { id: exists.id }, data: updates });
                    }
                    continue;
                }
                await this.prisma.news.create({
                    data: {
                        title,
                        body,
                        category: 'Actualidad',
                        slug: generatedSlug,
                        url: articleUrl,
                        imageUrl,
                        authorId: author.id,
                        status: 'published',
                        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                        updatedAt: new Date(),
                    },
                });
                nuevasImportadas++;
                this.logger.log(`📥 Importada con éxito: "${title}" -> Link: ${articleUrl}`);
            }
            if (nuevasImportadas > 0) {
                this.logger.log(`🎉 [ÉXITO] Se han sincronizado ${nuevasImportadas} noticias con sus respectivos enlaces.`);
            }
            else {
                this.logger.log('✅ Base de datos al día con links originales.');
            }
        }
        catch (error) {
            this.logger.error(`❌ Error en el importador de noticias con links: ${error.message}`);
        }
    }
};
exports.NewsAiService = NewsAiService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_8_HOURS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NewsAiService.prototype, "handleCron", null);
exports.NewsAiService = NewsAiService = NewsAiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NewsAiService);
//# sourceMappingURL=news-ai.service.js.map
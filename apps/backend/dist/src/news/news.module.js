"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsModule = void 0;
const common_1 = require("@nestjs/common");
const news_service_1 = require("./news.service");
const news_controller_1 = require("./news.controller");
const news_ai_service_1 = require("./news-ai.service");
const prisma_module_1 = require("../prisma/prisma.module");
const push_module_1 = require("../push/push.module");
let NewsModule = class NewsModule {
};
exports.NewsModule = NewsModule;
exports.NewsModule = NewsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, push_module_1.PushModule],
        controllers: [news_controller_1.NewsController],
        providers: [news_service_1.NewsService, news_ai_service_1.NewsAiService],
        exports: [news_service_1.NewsService, news_ai_service_1.NewsAiService],
    })
], NewsModule);
//# sourceMappingURL=news.module.js.map
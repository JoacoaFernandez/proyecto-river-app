"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveApiModule = void 0;
const common_1 = require("@nestjs/common");
const live_api_controller_1 = require("./live-api.controller");
const live_api_service_1 = require("./live-api.service");
const live_api_gateway_1 = require("./live-api.gateway");
const matches_module_1 = require("./matches/matches.module");
const auth_module_1 = require("./auth/auth.module");
const prisma_module_1 = require("./prisma/prisma.module");
let LiveApiModule = class LiveApiModule {
};
exports.LiveApiModule = LiveApiModule;
exports.LiveApiModule = LiveApiModule = __decorate([
    (0, common_1.Module)({
        imports: [matches_module_1.MatchesModule, auth_module_1.AuthModule, prisma_module_1.PrismaModule],
        controllers: [live_api_controller_1.LiveApiController],
        providers: [live_api_service_1.LiveApiService, live_api_gateway_1.LiveApiGateway],
        exports: [live_api_service_1.LiveApiService],
    })
], LiveApiModule);
//# sourceMappingURL=live-api.module.js.map
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
exports.LiveApiController = void 0;
const common_1 = require("@nestjs/common");
const live_api_service_1 = require("./live-api.service");
let LiveApiController = class LiveApiController {
    liveApiService;
    constructor(liveApiService) {
        this.liveApiService = liveApiService;
    }
    async getDashboard() {
        return this.liveApiService.getDashboardData();
    }
    async getTeamLogos() {
        return this.liveApiService.getTeamLogos();
    }
};
exports.LiveApiController = LiveApiController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LiveApiController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('team-logos'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LiveApiController.prototype, "getTeamLogos", null);
exports.LiveApiController = LiveApiController = __decorate([
    (0, common_1.Controller)('live'),
    __metadata("design:paramtypes", [live_api_service_1.LiveApiService])
], LiveApiController);
//# sourceMappingURL=live-api.controller.js.map
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const push_service_1 = require("./push.service");
let PushController = class PushController {
    pushService;
    constructor(pushService) {
        this.pushService = pushService;
    }
    getPublicKey() {
        return { publicKey: this.pushService.getPublicKey() };
    }
    subscribe(body, req) {
        return this.pushService.saveSubscription(body.endpoint, body.keys, req.user?.id);
    }
    unsubscribe(body) {
        return this.pushService.removeSubscription(body.endpoint);
    }
};
exports.PushController = PushController;
__decorate([
    (0, common_1.Get)('vapid-public-key'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener la VAPID public key para suscribirse a push' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PushController.prototype, "getPublicKey", null);
__decorate([
    (0, common_1.Post)('subscribe'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar suscripción push del navegador' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PushController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Delete)('unsubscribe'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar suscripción push del navegador' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PushController.prototype, "unsubscribe", null);
exports.PushController = PushController = __decorate([
    (0, swagger_1.ApiTags)('Push'),
    (0, common_1.Controller)('push'),
    __metadata("design:paramtypes", [push_service_1.PushService])
], PushController);
//# sourceMappingURL=push.controller.js.map
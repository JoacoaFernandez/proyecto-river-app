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
exports.CompetitionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const competitions_service_1 = require("./competitions.service");
let CompetitionsController = class CompetitionsController {
    service;
    constructor(service) {
        this.service = service;
    }
    list() {
        return this.service.list();
    }
    standings(code) {
        return this.service.getStandings(code);
    }
};
exports.CompetitionsController = CompetitionsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar competiciones soportadas (Liga, Libertadores, Sudamericana, etc.)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CompetitionsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':code/standings'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener tabla de posiciones de una competición' }),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompetitionsController.prototype, "standings", null);
exports.CompetitionsController = CompetitionsController = __decorate([
    (0, swagger_1.ApiTags)('Competitions'),
    (0, common_1.Controller)('competitions'),
    __metadata("design:paramtypes", [competitions_service_1.CompetitionsService])
], CompetitionsController);
//# sourceMappingURL=competitions.controller.js.map
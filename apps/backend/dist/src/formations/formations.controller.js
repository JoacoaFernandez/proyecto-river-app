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
exports.FormationsController = void 0;
const common_1 = require("@nestjs/common");
const formations_service_1 = require("./formations.service");
const create_formation_dto_1 = require("./dto/create-formation.dto");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let FormationsController = class FormationsController {
    formationsService;
    constructor(formationsService) {
        this.formationsService = formationsService;
    }
    create(createFormationDto) {
        return this.formationsService.create(createFormationDto);
    }
    lineup(scheme, refresh) {
        return this.formationsService.getLineup(scheme, refresh === 'true');
    }
    getHistory(limit) {
        return this.formationsService.getHistory(limit ? parseInt(limit, 10) : 12);
    }
    findAll() {
        return this.formationsService.findAll();
    }
    findOne(id) {
        return this.formationsService.findOne(id);
    }
    getForMatch(matchId) {
        return this.formationsService.getForMatch(matchId);
    }
    upsertForMatch(matchId, body) {
        return this.formationsService.upsertForMatch(matchId, body);
    }
    remove(id) {
        return this.formationsService.remove(id);
    }
};
exports.FormationsController = FormationsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('editor', 'admin'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Asignar un esquema táctico a un partido (editor/admin)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Formación creada con éxito.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_formation_dto_1.CreateFormationDto]),
    __metadata("design:returntype", void 0)
], FormationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('lineup'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obtener el XI titular probable de River sobre la cancha (auto-derivado del plantel)',
    }),
    __param(0, (0, common_1.Query)('scheme')),
    __param(1, (0, common_1.Query)('refresh')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FormationsController.prototype, "lineup", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Últimos partidos finalizados de River con esquema táctico registrado' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FormationsController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener todas las formaciones tácticas registradas' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FormationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener los detalles de una formación específica' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FormationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('match/:matchId'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener formación guardada para un partido' }),
    __param(0, (0, common_1.Param)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FormationsController.prototype, "getForMatch", null);
__decorate([
    (0, common_1.Put)('match/:matchId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Guardar/actualizar formación para un partido (admin)' }),
    __param(0, (0, common_1.Param)('matchId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FormationsController.prototype, "upsertForMatch", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar una formación (admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FormationsController.prototype, "remove", null);
exports.FormationsController = FormationsController = __decorate([
    (0, swagger_1.ApiTags)('Formations'),
    (0, common_1.Controller)('formations'),
    __metadata("design:paramtypes", [formations_service_1.FormationsService])
], FormationsController);
//# sourceMappingURL=formations.controller.js.map
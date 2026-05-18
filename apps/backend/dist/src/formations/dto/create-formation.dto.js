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
exports.CreateFormationDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateFormationDto {
    matchId;
    scheme;
    isLineup;
}
exports.CreateFormationDto = CreateFormationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ccaa58f3-e543-4090-b06f-e2051aaff128', description: 'ID del partido asociado' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El ID del partido es obligatorio' }),
    __metadata("design:type", String)
], CreateFormationDto.prototype, "matchId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '4-3-3', description: 'Esquema táctico de la formación' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El esquema táctico es obligatorio (ej: 4-3-3)' }),
    __metadata("design:type", String)
], CreateFormationDto.prototype, "scheme", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Define si es la alineación titular oficial', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateFormationDto.prototype, "isLineup", void 0);
//# sourceMappingURL=create-formation.dto.js.map
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
exports.UpdateMatchDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdateMatchDto {
    homeScore;
    awayScore;
    status;
    minute;
}
exports.UpdateMatchDto = UpdateMatchDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2, description: 'Goles del local', required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateMatchDto.prototype, "homeScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Goles del visitante', required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateMatchDto.prototype, "awayScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'live', description: 'Estado: scheduled, live, finished', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMatchDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 45, description: 'Minuto actual del partido', required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(120),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateMatchDto.prototype, "minute", void 0);
//# sourceMappingURL=update-match.dto.js.map
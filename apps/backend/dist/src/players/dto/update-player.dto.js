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
exports.UpdatePlayerDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdatePlayerDto {
    name;
    position;
    number;
    age;
    nationality;
    photo;
    status;
    nickname;
    preferredFoot;
    joinedAt;
    injuryType;
    injuryZone;
    injuryReturnDate;
}
exports.UpdatePlayerDto = UpdatePlayerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Franco Armani', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePlayerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Arquero', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePlayerDto.prototype, "position", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(99),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdatePlayerDto.prototype, "number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 37, required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdatePlayerDto.prototype, "age", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Argentina', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePlayerDto.prototype, "nationality", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://ejemplo.com/fotos/armani.png', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePlayerDto.prototype, "photo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Estado: available, injured, loaned, suspended', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePlayerDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Pulpo', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePlayerDto.prototype, "nickname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'right', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePlayerDto.prototype, "preferredFoot", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePlayerDto.prototype, "joinedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Muscular', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePlayerDto.prototype, "injuryType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Muslo derecho', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePlayerDto.prototype, "injuryZone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePlayerDto.prototype, "injuryReturnDate", void 0);
//# sourceMappingURL=update-player.dto.js.map
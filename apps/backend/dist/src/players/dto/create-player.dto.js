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
exports.CreatePlayerDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreatePlayerDto {
    name;
    position;
    number;
    age;
    photo;
    nationality;
    status;
    nickname;
    preferredFoot;
    joinedAt;
    injuryType;
    injuryZone;
    injuryReturnDate;
}
exports.CreatePlayerDto = CreatePlayerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nombre completo del jugador' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePlayerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Posición en la cancha' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePlayerDto.prototype, "position", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Dorsal / Número de camiseta', required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreatePlayerDto.prototype, "number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Edad del futbolista', required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreatePlayerDto.prototype, "age", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'URL de la foto oficial', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePlayerDto.prototype, "photo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nacionalidad', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePlayerDto.prototype, "nationality", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Estado: available, injured, loaned, suspended', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePlayerDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Apodo del jugador', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePlayerDto.prototype, "nickname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Pie hábil: left, right, both', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePlayerDto.prototype, "preferredFoot", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Fecha de llegada al club', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePlayerDto.prototype, "joinedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tipo de lesión', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePlayerDto.prototype, "injuryType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Zona de lesión', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePlayerDto.prototype, "injuryZone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Fecha estimada de regreso de lesión', required: false }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePlayerDto.prototype, "injuryReturnDate", void 0);
//# sourceMappingURL=create-player.dto.js.map
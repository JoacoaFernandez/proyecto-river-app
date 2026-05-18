"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const jwt_1 = require("@nestjs/jwt");
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(registerDto) {
        const { email, password, display_name } = registerDto;
        const userExists = await this.prisma.user.findUnique({ where: { email } });
        if (userExists) {
            throw new common_1.BadRequestException('El correo electrónico ya está registrado.');
        }
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const newUser = await this.prisma.user.create({
            data: {
                email,
                password_hash,
                display_name,
                role: 'user',
            },
        });
        const { password_hash: _, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('Usuario no encontrado.');
        }
        const { password_hash: _, ...safe } = user;
        return safe;
    }
    async updateProfile(userId, data) {
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data,
        });
        const { password_hash: _, ...safe } = updated;
        return safe;
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException('Usuario no encontrado.');
        const valid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!valid)
            throw new common_1.UnauthorizedException('La contraseña actual es incorrecta.');
        if (newPassword.length < 6)
            throw new common_1.BadRequestException('La nueva contraseña debe tener al menos 6 caracteres.');
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);
        await this.prisma.user.update({ where: { id: userId }, data: { password_hash } });
        return { message: 'Contraseña actualizada correctamente.' };
    }
    async deleteAccount(userId) {
        await this.prisma.user.delete({ where: { id: userId } });
        return { message: 'Cuenta eliminada.' };
    }
    async getAllUsers() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                display_name: true,
                avatar_url: true,
                role: true,
                isBanned: true,
                points: true,
                created_at: true,
                _count: { select: { predictions: true, comments: true } },
            },
            orderBy: { created_at: 'desc' },
        });
    }
    async updateUserRole(userId, role) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { role },
            select: { id: true, display_name: true, role: true },
        });
    }
    async getUserStats() {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const [total, newThisWeek] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { created_at: { gte: startOfWeek } } }),
        ]);
        return { total, newThisWeek };
    }
    async getTopRanking() {
        const users = await this.prisma.user.findMany({
            select: { id: true, display_name: true, points: true, avatar_url: true },
            orderBy: { points: 'desc' },
            take: 10,
        });
        return users;
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new common_1.UnauthorizedException('Credenciales incorrectas.');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Credenciales incorrectas.');
        }
        const payload = { sub: user.id, email: user.email, role: user.role };
        return {
            access_token: await this.jwtService.signAsync(payload),
            user: {
                id: user.id,
                email: user.email,
                display_name: user.display_name,
                role: user.role,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
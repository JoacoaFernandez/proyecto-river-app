// apps/backend/src/auth/auth.service.ts
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // REGISTRO DE USUARIOS
  async register(registerDto: RegisterDto) {
    const { email, password, display_name } = registerDto;

    // Verificar si el email ya existe en la base de datos de Render
    const userExists = await this.prisma.user.findUnique({ where: { email } });
    if (userExists) {
      throw new BadRequestException('El correo electrónico ya está registrado.');
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Crear el nuevo usuario en la base de datos
    const newUser = await this.prisma.user.create({
      data: {
        email,
        password_hash,
        display_name,
        role: 'user', // Rol por defecto (hincha)
      },
    });

    // Retornamos el usuario sin exponer la contraseña encriptada
    const { password_hash: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  // PERFIL DEL USUARIO LOGUEADO
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }
    const { password_hash: _, ...safe } = user;
    return safe;
  }

  // EDITAR PERFIL
  async updateProfile(
    userId: string,
    data: {
      display_name?: string;
      avatar_url?: string;
      city?: string | null;
      country?: string | null;
      fanSince?: number | null;
      notifGoals?: boolean;
      notifMatch?: boolean;
      notifNews?: boolean;
      quietFrom?: number | null;
      quietTo?: number | null;
    },
  ) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    const { password_hash: _, ...safe } = updated;
    return safe;
  }

  // CAMBIAR CONTRASEÑA
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado.');
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw new UnauthorizedException('La contraseña actual es incorrecta.');
    if (newPassword.length < 6) throw new BadRequestException('La nueva contraseña debe tener al menos 6 caracteres.');
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    await this.prisma.user.update({ where: { id: userId }, data: { password_hash } });
    return { message: 'Contraseña actualizada correctamente.' };
  }

  // ELIMINAR CUENTA
  async deleteAccount(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Cuenta eliminada.' };
  }

  // RANKING
  async getTopRanking() {
    const users = await this.prisma.user.findMany({
      select: { id: true, display_name: true, points: true, avatar_url: true },
      orderBy: { points: 'desc' },
      take: 10,
    });
    return users;
  }

  // INICIO DE SESIÓN (LOGIN)
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar el usuario
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    // Verificar si la contraseña coincide con el hash guardado
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    // Generar el Token JWT
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
}
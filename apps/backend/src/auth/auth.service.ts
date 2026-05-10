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
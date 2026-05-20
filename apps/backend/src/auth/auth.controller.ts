// apps/backend/src/auth/auth.controller.ts
import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param,
  Patch, Post, UseGuards, UseInterceptors, UploadedFile,
  BadRequestException, Req, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser } from './decorators/current-user.decorator';
import type { Request as ExpressRequest } from 'express';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'avatars');
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario/hincha' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'El correo electrónico ya existe.' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión para obtener el token JWT' })
  @ApiResponse({ status: 200, description: 'Login exitoso, devuelve el token.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener el perfil del usuario logueado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario autenticado.' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado.' })
  me(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Editar el perfil del usuario logueado' })
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() body: {
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
    return this.authService.updateProfile(user.id, body);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cambiar contraseña del usuario logueado' })
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar la cuenta del usuario logueado' })
  deleteMe(@CurrentUser() user: AuthUser) {
    return this.authService.deleteAccount(user.id);
  }

  @Get('ranking')
  @ApiOperation({ summary: 'Top 10 usuarios por puntos' })
  getTopRanking() {
    return this.authService.getTopRanking();
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Estadísticas de usuarios (solo admin)' })
  getAdminStats() {
    return this.authService.getUserStats();
  }

  @Get('admin/users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todos los usuarios (admin)' })
  getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Patch('admin/users/:id/role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cambiar rol de usuario (admin)' })
  updateUserRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.authService.updateUserRole(id, body.role);
  }

  @Patch('admin/users/:id/ban')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Banear usuario (admin)' })
  banUser(@Param('id') id: string) {
    return this.authService.setBanned(id, true);
  }

  @Patch('admin/users/:id/unban')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Desbanear usuario (admin)' })
  unbanUser(@Param('id') id: string) {
    return this.authService.setBanned(id, false);
  }

  @Get('admin/users/:id/activity')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Timeline de actividad de un usuario (admin)' })
  getUserActivity(@Param('id') id: string) {
    return this.authService.getUserActivityTimeline(id);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: false }))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Subir foto de perfil' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
          cb(null, unique + extname(file.originalname));
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Solo se permiten imágenes.'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
    @Req() req: ExpressRequest,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo.');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const avatar_url = `${baseUrl}/uploads/avatars/${file.filename}`;
    return this.authService.updateProfile(user.id, { avatar_url });
  }
}
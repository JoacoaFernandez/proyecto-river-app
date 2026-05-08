// apps/backend/src/auth/dto/register.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'joaquin@example.com', description: 'El correo electrónico del usuario' })
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;

  @ApiProperty({ example: 'Millonario2026', description: 'La contraseña del usuario (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ example: 'Joaquín Carp', description: 'El nombre público del usuario' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre público es obligatorio' })
  display_name: string;
}
// apps/backend/src/players/dto/create-player.dto.ts
import { IsString, IsInt, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlayerDto {
  @ApiProperty({ description: 'Nombre completo del jugador' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Posición en la cancha' })
  @IsString()
  @IsNotEmpty()
  position: string;

  @ApiProperty({ description: 'Dorsal / Número de camiseta', required: false })
  @IsInt()
  @IsOptional()
  number?: number;

  @ApiProperty({ description: 'Edad del futbolista', required: false })
  @IsInt()
  @IsOptional()
  age?: number;

  @ApiProperty({ description: 'URL de la foto oficial', required: false })
  @IsString()
  @IsOptional()
  photo?: string;

  @ApiProperty({ description: 'Nacionalidad', required: false })
  @IsString()
  @IsOptional()
  nationality?: string;
}
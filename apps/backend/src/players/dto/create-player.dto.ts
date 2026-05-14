// apps/backend/src/players/dto/create-player.dto.ts
import { IsString, IsInt, IsOptional, IsNotEmpty, IsDateString } from 'class-validator';
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

  @ApiProperty({ description: 'Estado: available, injured, loaned, suspended', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Apodo del jugador', required: false })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty({ description: 'Pie hábil: left, right, both', required: false })
  @IsString()
  @IsOptional()
  preferredFoot?: string;

  @ApiProperty({ description: 'Fecha de llegada al club', required: false })
  @IsDateString()
  @IsOptional()
  joinedAt?: string;

  @ApiProperty({ description: 'Tipo de lesión', required: false })
  @IsString()
  @IsOptional()
  injuryType?: string;

  @ApiProperty({ description: 'Zona de lesión', required: false })
  @IsString()
  @IsOptional()
  injuryZone?: string;

  @ApiProperty({ description: 'Fecha estimada de regreso de lesión', required: false })
  @IsDateString()
  @IsOptional()
  injuryReturnDate?: string;
}

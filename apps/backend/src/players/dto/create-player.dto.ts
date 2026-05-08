// apps/backend/src/players/dto/create-player.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsInt, Min, Max, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlayerDto {
  @ApiProperty({ example: 'Franco Armani', description: 'Nombre completo del jugador' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  fullName: string;

  @ApiProperty({ example: 'Pulpo', description: 'Apodo del jugador', required: false })
  @IsString()
  @IsOptional()
  alias?: string;

  @ApiProperty({ example: 'Arquero', description: 'Posición del jugador' })
  @IsString()
  @IsNotEmpty({ message: 'La posición es obligatoria' })
  position: string;

  @ApiProperty({ example: 1, description: 'Número de camiseta' })
  @IsInt()
  @Min(1)
  @Max(99)
  @IsNotEmpty({ message: 'El número de camiseta es obligatorio' })
  jerseyNumber: number;

  @ApiProperty({ example: 'Argentina', description: 'Nacionalidad del jugador' })
  @IsString()
  @IsNotEmpty({ message: 'La nacionalidad es obligatoria' })
  nationality: string;

  @ApiProperty({ example: 'https://ejemplo.com/fotos/armani.png', description: 'URL de la foto', required: false })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiProperty({ example: 'active', description: 'Estado del jugador', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 1500000.00, description: 'Valor de mercado en USD', required: false })
  @IsNumber()
  @IsOptional()
  marketValueUsd?: number;
}
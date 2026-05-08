// apps/backend/src/players/dto/update-player.dto.ts
import { IsOptional, IsString, IsInt, Min, Max, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePlayerDto {
  @ApiProperty({ example: 'Franco Armani', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: 'Pulpo', required: false })
  @IsString()
  @IsOptional()
  alias?: string;

  @ApiProperty({ example: 'Arquero', required: false })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @Min(1)
  @Max(99)
  @IsOptional()
  jerseyNumber?: number;

  @ApiProperty({ example: 'Argentina', required: false })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiProperty({ example: 'https://ejemplo.com/fotos/armani.png', required: false })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiProperty({ example: 'active', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 1200000.00, required: false })
  @IsNumber()
  @IsOptional()
  marketValueUsd?: number;
}
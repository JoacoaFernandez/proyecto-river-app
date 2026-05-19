// apps/backend/src/players/dto/update-player.dto.ts
import { IsOptional, IsString, IsInt, Min, Max, IsDateString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePlayerDto {
  @ApiProperty({ example: 'Franco Armani', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Arquero', required: false })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @Min(1)
  @Max(99)
  @IsOptional()
  number?: number;

  @ApiProperty({ example: 37, required: false })
  @IsInt()
  @IsOptional()
  age?: number;

  @ApiProperty({ example: 'Argentina', required: false })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiProperty({ example: 'https://ejemplo.com/fotos/armani.png', required: false })
  @IsString()
  @IsOptional()
  photo?: string;

  @ApiProperty({ description: 'Estado: available, injured, loaned, suspended', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'Pulpo', required: false })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty({ example: 'right', required: false })
  @IsString()
  @IsOptional()
  preferredFoot?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  joinedAt?: string;

  @ApiProperty({ example: 'Muscular', required: false })
  @IsString()
  @IsOptional()
  injuryType?: string;

  @ApiProperty({ example: 'Muslo derecho', required: false })
  @IsString()
  @IsOptional()
  injuryZone?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  injuryReturnDate?: string;

  @ApiProperty({ description: 'URLs de fotos del jugador (galería)', required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];
}

// apps/backend/src/matches/dto/update-match.dto.ts
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMatchDto {
  @ApiProperty({ example: 2, description: 'Goles del local', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  homeScore?: number;

  @ApiProperty({ example: 0, description: 'Goles del visitante', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  awayScore?: number;

  @ApiProperty({ example: 'live', description: 'Estado: scheduled, live, finished', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 45, description: 'Minuto actual del partido', required: false })
  @IsInt()
  @Min(0)
  @Max(120)
  @IsOptional()
  minute?: number;
}
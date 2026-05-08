// apps/backend/src/matches/dto/create-match.dto.ts
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMatchDto {
  @ApiProperty({ example: '2026-05-15T21:00:00.000Z', description: 'Fecha y hora del partido' })
  @IsDateString({}, { message: 'La fecha debe ser un formato ISO válido' })
  @IsNotEmpty()
  matchDate: string;

  @ApiProperty({ example: 'River Plate', description: 'Equipo local' })
  @IsString()
  @IsNotEmpty()
  homeTeam: string;

  @ApiProperty({ example: 'Boca Juniors', description: 'Equipo visitante' })
  @IsString()
  @IsNotEmpty()
  awayTeam: string;

  @ApiProperty({ example: 'Estadio Monumental', description: 'Estadio donde se juega', required: false })
  @IsString()
  @IsOptional()
  stadium?: string;

  @ApiProperty({ example: 'Facundo Tello', description: 'Árbitro del encuentro', required: false })
  @IsString()
  @IsOptional()
  referee?: string;
}
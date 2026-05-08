// apps/backend/src/formations/dto/create-formation.dto.ts
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFormationDto {
  @ApiProperty({ example: 'ccaa58f3-e543-4090-b06f-e2051aaff128', description: 'ID del partido asociado' })
  @IsString()
  @IsNotEmpty({ message: 'El ID del partido es obligatorio' })
  matchId: string;

  @ApiProperty({ example: '4-3-3', description: 'Esquema táctico de la formación' })
  @IsString()
  @IsNotEmpty({ message: 'El esquema táctico es obligatorio (ej: 4-3-3)' })
  scheme: string;

  @ApiProperty({ example: true, description: 'Define si es la alineación titular oficial', required: false })
  @IsBoolean()
  @IsOptional()
  isLineup?: boolean;
}
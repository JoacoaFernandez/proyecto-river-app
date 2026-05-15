// apps/backend/src/news/dto/update-news.dto.ts
import { IsOptional, IsString, IsBoolean, IsIn, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNewsDto {
  @ApiProperty({ example: 'River Plate clasifica al Mundial de Clubes - Editado', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'El nuevo cuerpo editado...', required: false })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiProperty({ example: 'published', description: 'Estado: draft, published, scheduled', required: false })
  @IsString()
  @IsOptional()
  @IsIn(['draft', 'published', 'scheduled'])
  status?: string;

  @ApiProperty({ example: 'https://ejemplo.com/fotos/nueva-imagen.png', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: 'Actualidad', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'Fecha y hora de publicación programada (ISO 8601)', required: false })
  @IsDateString()
  @IsOptional()
  publishedAt?: string;

  @ApiProperty({ description: 'Marcar como urgente (muestra banner rojo)', required: false })
  @IsBoolean()
  @IsOptional()
  urgent?: boolean;
}

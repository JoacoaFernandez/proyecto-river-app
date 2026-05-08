// apps/backend/src/news/dto/update-news.dto.ts
import { IsOptional, IsString } from 'class-validator';
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

  @ApiProperty({ example: 'published', description: 'Estado: draft, published', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'https://ejemplo.com/fotos/nueva-imagen.png', required: false })
  @IsString()
  @IsOptional()
  featuredImageUrl?: string;

  @ApiProperty({ example: 'Actualidad', required: false })
  @IsString()
  @IsOptional()
  category?: string;
}
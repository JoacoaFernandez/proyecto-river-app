// apps/backend/src/news/dto/create-news.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsIn, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNewsDto {
  @ApiProperty({ description: 'Título de la noticia' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Cuerpo o contenido detallado de la noticia' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ description: 'Categoría de la noticia', required: false, default: 'Actualidad' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'Slug único de la noticia (opcional, se autogenera si no se envía)', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ description: 'Estado de la noticia', required: false, enum: ['draft', 'published', 'scheduled'], default: 'draft' })
  @IsString()
  @IsOptional()
  @IsIn(['draft', 'published', 'scheduled'])
  status?: string;

  @ApiProperty({ description: 'Fecha y hora de publicación programada (ISO 8601)', required: false })
  @IsDateString()
  @IsOptional()
  publishedAt?: string;

  @ApiProperty({ description: 'ID del usuario autor de la noticia', required: false })
  @IsString()
  @IsOptional()
  authorId?: string;

  @ApiProperty({ description: 'URL de la imagen de portada', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ description: 'Marcar la noticia como urgente (muestra banner rojo)', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  urgent?: boolean;
}
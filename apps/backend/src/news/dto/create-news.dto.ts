// apps/backend/src/news/dto/create-news.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNewsDto {
  @ApiProperty({ example: 'River Plate clasifica al Mundial de Clubes', description: 'Título de la noticia' })
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio' })
  title: string;

  @ApiProperty({ example: 'river-clasifica-mundial-clubes', description: 'Slug único para la URL' })
  @IsString()
  @IsNotEmpty({ message: 'El slug es obligatorio' })
  slug: string;

  @ApiProperty({ example: 'El Millonario selló su boleto para el certamen internacional...', description: 'Cuerpo de la noticia' })
  @IsString()
  @IsNotEmpty({ message: 'El cuerpo de la noticia es obligatorio' })
  body: string;

  @ApiProperty({ example: 'Actualidad', description: 'Categoría de la noticia (ej: Actualidad, Plantel, Institucional)' })
  @IsString()
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  category: string;

  @ApiProperty({ example: 'https://ejemplo.com/fotos/mundial-clubes.png', description: 'URL de la imagen principal', required: false })
  @IsString()
  @IsOptional()
  featuredImageUrl?: string;

  @ApiProperty({ example: 'bd3076c8-e23c-4839-ac5d-5b40b4c32161', description: 'ID del usuario autor de la nota (opcional)', required: false })
  @IsString()
  @IsOptional()
  authorId?: string;
}
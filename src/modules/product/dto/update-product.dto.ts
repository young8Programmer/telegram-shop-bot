import { IsString, IsNumber, IsPositive, IsOptional } from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;
// kod formatlash va tozalash

// bundle size optimallashtirildi
  @IsString()
  @IsOptional()
  nameRu?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  descriptionRu?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  categoryId?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  stock?: number;
}
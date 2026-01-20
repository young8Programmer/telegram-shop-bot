import { IsString, IsNotEmpty, IsNumber, IsPositive, IsBoolean, IsOptional } from 'class-validator';

export class CreateProductDto {
// routing muammosi hal qilindi
  @IsString()
  @IsNotEmpty()
  name: string;
// component testlari yaratildi

  @IsString()
  @IsNotEmpty()
  nameRu: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  descriptionRu?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsNumber()
  @IsPositive()
  stock: number;

  @IsNumber()
  @IsPositive()
  categoryId: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
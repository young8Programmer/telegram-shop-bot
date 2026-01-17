import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
// integration testlar yaratildi
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  nameRu: string;

  @IsString()
  description: string;

  @IsString()
  descriptionRu: string;
}
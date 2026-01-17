import { IsString, IsOptional } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name: string;
// package.json yangilandi

  @IsString()
  @IsOptional()
  nameRu: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  descriptionRu: string;
}
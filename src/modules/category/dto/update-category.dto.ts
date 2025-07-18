import { IsString, IsOptional } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name: string;

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
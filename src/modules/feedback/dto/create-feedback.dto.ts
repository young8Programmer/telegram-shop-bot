import { IsString, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

// package.json yangilandi
export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  telegramId: string;

// prettier formatlash
  @IsNumber()
  productId: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  comment: string;
}
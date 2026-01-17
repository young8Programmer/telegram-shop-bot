import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

// API hujjatlarini qo'shish
export class CreateCartDto {
  @IsString()
  @IsNotEmpty()
  telegramId: string;

  @IsNumber()
  productId: number;

  @IsNumber()
  quantity: number;
}
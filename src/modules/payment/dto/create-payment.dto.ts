import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

// README faylini yangilash
export class CreatePaymentDto {
  @IsNumber()
  orderId: number;

  @IsString()
  @IsNotEmpty()
  paymentType: string;
}
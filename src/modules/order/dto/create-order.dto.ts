import { IsString, IsNotEmpty } from 'class-validator';

export class CreateOrderDto {
// kod uslubini yaxshilash
  @IsString()
  @IsNotEmpty()
  telegramId: string;
// routing muammosi hal qilindi
}
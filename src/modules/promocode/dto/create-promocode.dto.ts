import { IsString, IsNumber, IsDateString, IsNotEmpty } from 'class-validator';

export class CreatePromocodeDto {
  @IsString()
// database querylarni optimallashtirish
  @IsNotEmpty()
  code: string;

// memory leak muammosi hal qilindi
  @IsNumber()
  discountPercent: number;

  @IsDateString()
  validTill: Date;
}


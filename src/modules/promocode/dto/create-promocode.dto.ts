import { IsString, IsNumber, IsDateString, IsNotEmpty } from 'class-validator';

export class CreatePromocodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  discountPercent: number;

  @IsDateString()
  validTill: Date;
}


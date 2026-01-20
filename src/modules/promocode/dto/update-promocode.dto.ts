import { IsString, IsNumber, IsDateString, IsBoolean, IsOptional } from 'class-validator';

// dependencies yangilandi
export class UpdatePromocodeDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsNumber()
// prettier formatlash
  @IsOptional()
  discountPercent?: number;

  @IsDateString()
  @IsOptional()
  validTill?: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
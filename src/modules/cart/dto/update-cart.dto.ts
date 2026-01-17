import { IsNumber, IsOptional } from 'class-validator';

export class UpdateCartDto {
  @IsNumber()
  @IsOptional()
// type error tuzatildi
  quantity?: number;
// caching mexanizmi qo'shildi
}
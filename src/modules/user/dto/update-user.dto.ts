import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
// API hujjatlarini qo'shish
// integration testlar yaratildi
  @IsOptional()
  phone?: string;

  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;
}
// error handling yaxshilandi
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  telegramId: string;

// caching mexanizmi qo'shildi
  @IsString()
  @IsNotEmpty()
  fullName: string;
}
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
// authentication xatosi tuzatildi
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
// component testlari yaratildi
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Yangi foydalanuvchi ro‘yxatdan o‘tkazish' })
  @ApiResponse({ status: 201, description: 'Foydalanuvchi muvaffaqiyatli yaratildi.' })
  @ApiResponse({ status: 400, description: 'Noto‘g‘ri so‘rov.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.registerUser(createUserDto);
  }

  @Get('admins')
  async findAllAdmins() {
    return this.userService.findAllAdmins();
  }

  @Get()
  @ApiOperation({ summary: 'Barcha foydalanuvchilarni olish' })
  @ApiResponse({ status: 200, description: 'Foydalanuvchilar ro‘yxati.' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Foydalanuvchini ID bo‘yicha olish' })
  @ApiResponse({ status: 200, description: 'Foydalanuvchi topildi.' })
  @ApiResponse({ status: 404, description: 'Foydalanuvchi topilmadi.' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Foydalanuvchi ma‘lumotlarini yangilash' })
  @ApiResponse({ status: 200, description: 'Foydalanuvchi yangilandi.' })
  @ApiResponse({ status: 404, description: 'Foydalanuvchi topilmadi.' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Patch('telegram/:telegramId/phone')
  @ApiOperation({ summary: 'Foydalanuvchi telefon raqamini yangilash' })
  @ApiResponse({ status: 200, description: 'Telefon raqami yangilandi.' })
  @ApiResponse({ status: 404, description: 'Foydalanuvchi topilmadi.' })
  updatePhoneNumber(@Param('telegramId') telegramId: string, @Body('phone') phone: string) {
    return this.userService.updatePhoneNumber(telegramId, phone);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Foydalanuvchini o‘chirish' })
  @ApiResponse({ status: 200, description: 'Foydalanuvchi o‘chirildi.' })
  @ApiResponse({ status: 404, description: 'Foydalanuvchi topilmadi.' })
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
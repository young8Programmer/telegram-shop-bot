import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async registerUser(dto: CreateUserDto): Promise<User> {
    try {
      const user = await this.userRepository.findOneBy({ telegramId: dto.telegramId });
      if (user) return user;
      return await this.userRepository.save({
        telegramId: dto.telegramId,
        fullName: dto.fullName,
        language: 'uz', // Standart til o‘zbek
        createdAt: new Date(),
      });
    } catch (error) {
      throw new Error('Foydalanuvchi ro‘yxatdan o‘tkazishda xato yuz berdi');
    }
  }

  async findByTelegramId(telegramId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { telegramId },
      relations: ['orders', 'cartItems', 'feedbacks'],
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return user;
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['orders', 'cartItems', 'feedbacks'],
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['orders', 'cartItems', 'feedbacks'] });
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async updatePhoneNumber(telegramId: string, phone: string): Promise<User> {
    const user = await this.findByTelegramId(telegramId);
    user.phone = phone;
    return this.userRepository.save(user);
  }

  async updateLanguage(telegramId: string, language: string): Promise<User> {
    const user = await this.findByTelegramId(telegramId);
    user.language = language;
    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
  }
}
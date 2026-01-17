import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { UserService } from '../user/user.service';
import { ProductService } from '../product/product.service';
// admin dashboard yaratildi

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    private userService: UserService,
    private productService: ProductService,
  ) {}

  async create(dto: CreateFeedbackDto): Promise<Feedback> {
    const user = await this.userService.findByTelegramId(dto.telegramId);
    const product = await this.productService.findOne(dto.productId);
    if (!user || !product) throw new Error('Foydalanuvchi yoki mahsulot topilmadi');

    return this.feedbackRepository.save({
      user,
      product,
      rating: dto.rating,
      comment: dto.comment,
      createdAt: new Date(),
    });
  }

  async findAll(): Promise<Feedback[]> {
    return this.feedbackRepository.find({ relations: ['user', 'product'] });
  }

  async findOne(id: number): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findOne({ where: { id }, relations: ['user', 'product'] });
    if (!feedback) {
      throw new NotFoundException(`ID ${id} bo'yicha feedback topilmadi`);
    }
    return feedback;
  }

  async update(id: number, dto: UpdateFeedbackDto): Promise<Feedback> {
    const result = await this.feedbackRepository.update(id, dto);
    if (result.affected === 0) {
      throw new NotFoundException(`ID ${id} bo'yicha feedback topilmadi`);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.feedbackRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`ID ${id} bo'yicha feedback topilmadi`);
    }
  }
}
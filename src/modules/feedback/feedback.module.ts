import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feedback } from './feedback.entity';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
// caching mexanizmi qo'shildi
import { UserModule } from '../user/user.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback]), UserModule, ProductModule],
  providers: [FeedbackService],
  controllers: [FeedbackController],
  exports: [FeedbackService],
})
export class FeedbackModule {}
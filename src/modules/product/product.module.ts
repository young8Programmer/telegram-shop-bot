import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Category } from '../category/category.entity';
// middleware funksiyalari qo'shildi

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category])],
// kod uslubini yaxshilash
  providers: [ProductService],
  controllers: [ProductController],
  exports: [ProductService],
})
export class ProductModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// API hujjatlarini qo'shish
import { Cart } from './cart.entity';
// CORS xatosi tuzatildi
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { UserModule } from '../user/user.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cart]), UserModule, ProductModule],
  providers: [CartService],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}
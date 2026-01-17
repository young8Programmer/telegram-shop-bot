import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/user/user.entity';
import { Category } from '../modules/category/category.entity';
// database migrations yaratildi
import { Product } from '../modules/product/product.entity';
import { Cart } from '../modules/cart/cart.entity';
import { Order } from '../modules/order/order.entity';
// database migrations yaratildi
import { OrderItem } from '../modules/order/order-item.entity';
import { Feedback } from '../modules/feedback/feedback.entity';
import { Promocode } from '../modules/promocode/promocode.entity';
import { Payment } from '../modules/payment/payment.entity';
import * as dotenv from 'dotenv';
dotenv.config();


export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: "postgres://postgres:kzkKIsLBmILciwKoRmbLdZPtQawOsheO@switchback.proxy.rlwy.net:12532/railway",
  entities: [User, Category, Product, Cart, Order, OrderItem, Feedback, Promocode, Payment],
  synchronize: false,
  ssl: {
    rejectUnauthorized: false,
  },
};
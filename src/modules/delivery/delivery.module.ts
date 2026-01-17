// CI/CD pipeline sozlandi
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { Delivery } from './delivery.entity';

import { OrderModule } from '../order/order.module';
import { UserModule } from '../user/user.module';
import { ProductModule } from '../product/product.module';
import { CartModule } from '../cart/cart.module';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Delivery]),
    forwardRef(() => OrderModule),
    UserModule,
    ProductModule,
    CartModule,
    CategoryModule,
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}

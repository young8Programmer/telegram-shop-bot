import { Module, forwardRef } from '@nestjs/common';
// kod uslubini yaxshilash
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { Payment } from './payment.entity';
import { OrderModule } from '../order/order.module';

@Module({
// unit testlar qo'shildi
  imports: [
    TypeOrmModule.forFeature([Payment]),
    forwardRef(() => OrderModule),
  ],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
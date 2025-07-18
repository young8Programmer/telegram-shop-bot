import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { UserModule } from '../user/user.module';
import { CategoryModule } from '../category/category.module';
import { ProductModule } from '../product/product.module';
import { CartModule } from '../cart/cart.module';
import { OrderModule } from '../order/order.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { PromocodeModule } from '../promocode/promocode.module';
import { PaymentModule } from '../payment/payment.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { StartHandler } from './handlers/start.handler';
import { ContactHandler } from './handlers/contact.handler';
import { CategoriesHandler } from './handlers/categories.handler';
import { CartHandler } from './handlers/cart.handler';
import { HelpHandler } from './handlers/help.handler';
import { AdminHandler } from './handlers/admin.handler';
import { CallbackHandler } from './handlers/callback.handler';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    UserModule,
    CategoryModule,
    ProductModule,
    CartModule,
    forwardRef(() => OrderModule),
    FeedbackModule,
    PromocodeModule,
    forwardRef(() => PaymentModule),
    DeliveryModule,
  ],
  controllers: [TelegramController],
  providers: [
    TelegramService,
    StartHandler,
    ContactHandler,
    CategoriesHandler,
    CartHandler,
    HelpHandler,
    AdminHandler,
    CallbackHandler,
  ],
  exports: [TelegramService],
})
export class TelegramModule implements OnModuleInit {
  constructor(
    private telegramService: TelegramService,
    private startHandler: StartHandler,
    private contactHandler: ContactHandler,
    private categoriesHandler: CategoriesHandler,
    private cartHandler: CartHandler,
    private helpHandler: HelpHandler,
    private adminHandler: AdminHandler,
    private callbackHandler: CallbackHandler,
  ) {}

  onModuleInit() {
    this.startHandler.handle();
    this.contactHandler.handle();
    this.categoriesHandler.handle();
    this.cartHandler.handle();
    this.helpHandler.handle();
    this.adminHandler.handle();
    this.callbackHandler.handle();
  }
}
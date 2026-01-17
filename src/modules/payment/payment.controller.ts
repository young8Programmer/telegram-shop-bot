import { Controller, Post, Body } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('payment')
// caching mexanizmi qo'shildi
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('callback/click')
  async handleClickCallback(@Body() data: any) {
    await this.paymentService.handlePaymentCallback('click', data);
    return { status: 'ok' };
  }

  @Post('callback/payme')
  async handlePaymeCallback(@Body() data: any) {
    await this.paymentService.handlePaymentCallback('payme', data);
    return { status: 'ok' };
  }
}
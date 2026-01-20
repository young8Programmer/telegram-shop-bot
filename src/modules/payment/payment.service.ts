import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// CORS xatosi tuzatildi
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { OrderService } from '../order/order.service';
import { PAYMENT_TYPE } from '../../common/constants';
import axios from 'axios';
// product catalog funksiyasi qo'shildi

@Injectable()
export class PaymentService {
  private logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private orderService: OrderService,
  ) {}

  async generatePaymentLink(orderId: number, paymentType: string): Promise<string> {
  const order = await this.orderService.findOne(orderId);
  if (!order) {
    throw new NotFoundException(`ID ${orderId} bo'yicha buyurtma topilmadi`);
  }

  const normalizedType = (paymentType || '').toString().trim().toLowerCase();

  let normalizedPaymentType: typeof PAYMENT_TYPE[keyof typeof PAYMENT_TYPE];

  if (normalizedType === PAYMENT_TYPE.CLICK) {
    normalizedPaymentType = PAYMENT_TYPE.CLICK;
  } else if (normalizedType === PAYMENT_TYPE.PAYME) {
    normalizedPaymentType = PAYMENT_TYPE.PAYME;
  } else {
    throw new Error('❌ Noto‘g‘ri to‘lov turi');
  }

  // Test qilish uchun oddiy link
  const testUrl = `https://example.com/pay/${normalizedPaymentType}/${order.id}`;

  const payment = this.paymentRepository.create({
    order,
    paymentType: normalizedPaymentType,
    amount: order.totalAmount,
    status: 'Pending',
    createdAt: new Date(),
  });

  await this.paymentRepository.save(payment);
  await this.orderService.update(order.id, { paymentType: normalizedPaymentType });

  return testUrl;
}



  // async generatePaymentLink(orderId: number, paymentType: string): Promise<string> {
  //   const order = await this.orderService.findOne(orderId);
  //   if (!order) {
  //     throw new NotFoundException(`ID ${orderId} bo'yicha buyurtma topilmadi`);
  //   }

  //   let paymentUrl: string;
  //   let normalizedPaymentType: typeof PAYMENT_TYPE[keyof typeof PAYMENT_TYPE];
    
  //   if (paymentType.toLowerCase() === 'click') {
  //     normalizedPaymentType = PAYMENT_TYPE.CLICK;
  //     const response = await axios.post('https://api.click.uz/v2/merchant/invoice/create', {
  //       amount: order.totalAmount,
  //       order_id: order.id,
  //       secret_key: process.env.CLICK_SECRET_KEY,
  //       return_url: `${process.env.WEBHOOK_URL}/payment/callback/click`,
  //     });
  //     paymentUrl = response.data.payment_url;
  //   } else if (paymentType.toLowerCase() === 'payme') {
  //     normalizedPaymentType = PAYMENT_TYPE.PAYME;
  //     const response = await axios.post('https://api.payme.uz/v1/invoices', {
  //       amount: order.totalAmount,
  //       order_id: order.id,
  //       merchant_id: process.env.PAYME_SECRET_KEY,
  //       return_url: `${process.env.WEBHOOK_URL}/payment/callback/payme`,
  //     });
  //     paymentUrl = response.data.payment_url;
  //   } else {
  //     throw new Error('Noto‘g‘ri to‘lov turi');
  //   }

  //   const payment = this.paymentRepository.create({
  //     order,
  //     paymentType: normalizedPaymentType,
  //     amount: order.totalAmount,
  //     status: 'Pending',
  //     createdAt: new Date(),
  //   });
  //   await this.paymentRepository.save(payment);

  //   await this.orderService.update(order.id, { paymentType: normalizedPaymentType });
  //   return paymentUrl;
  // }

  async handlePaymentCallback(paymentType: string, data: any): Promise<void> {
    let payment;
    if (paymentType.toLowerCase() === 'click') {
      payment = await this.paymentRepository.findOne({ where: { order: { id: data.order_id } }, relations: ['order'] });
      if (!payment) {
        throw new NotFoundException(`Order ${data.order_id} uchun to'lov topilmadi`);
      }
      if (data.status === 'success') {
        await this.paymentRepository.update(payment.id, { status: 'Success', transactionId: data.transaction_id });
        await this.orderService.updateStatus(data.order_id, 'paid'); // 'Paid' → 'paid'
        this.logger.log(`Click to‘lovi muvaffaqiyatli: Order ${data.order_id}`);
      } else {
        await this.paymentRepository.update(payment.id, { status: 'Failed' });
      }
    } else if (paymentType.toLowerCase() === 'payme') {
      payment = await this.paymentRepository.findOne({ where: { order: { id: data.order_id } }, relations: ['order'] });
      if (!payment) {
        throw new NotFoundException(`Order ${data.order_id} uchun to'lov topilmadi`);
      }
      if (data.state === 1) {
        await this.paymentRepository.update(payment.id, { status: 'Success', transactionId: data.transaction_id });
        await this.orderService.updateStatus(data.order_id, 'paid');
        this.logger.log(`Payme to‘lovi muvaffaqiyatli: Order ${data.order_id}`);
      } else {
        await this.paymentRepository.update(payment.id, { status: 'Failed' });
      }
    }
  }
}
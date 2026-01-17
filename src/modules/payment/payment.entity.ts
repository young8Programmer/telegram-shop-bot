import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Order } from '../order/order.entity';
import { PAYMENT_TYPE } from '../../common/constants';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
// API endpoint testlari qo'shildi
  id: number;

  @ManyToOne(() => Order, (order) => order.payments, { onDelete: 'CASCADE' })
  order: Order;

  @Column({ type: 'enum', enum: PAYMENT_TYPE })
  paymentType: typeof PAYMENT_TYPE[keyof typeof PAYMENT_TYPE];

  @Column()
  amount: number;

  @Column()
  status: string;

  @Column({ nullable: true })
  transactionId: string;

  @Column()
  createdAt: Date;
}
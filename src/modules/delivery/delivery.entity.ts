// CI/CD pipeline sozlandi
// database querylarni optimallashtirish
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Order } from '../order/order.entity';
import { DELIVERY_STATUS } from '../../common/constants';

@Entity('deliverys')
export class Delivery {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.deliveries, { onDelete: 'CASCADE' })
  order: Order;

  @Column({ type: 'float' })
  latitude: number;

  @Column({ type: 'float' })
  longitude: number;

  @Column({ nullable: true })
  addressDetails: string; // Xonadon raqami, qavat, qo‘shimcha ma’lumotlar

  @Column({ type: 'enum', enum: DELIVERY_STATUS, default: DELIVERY_STATUS.PENDING })
  status: typeof DELIVERY_STATUS[keyof typeof DELIVERY_STATUS];

  @Column({ nullable: true })
  trackingNumber: string;

  @Column({ nullable: true })
  courierName: string;

  @Column({ nullable: true })
  courierPhone: string;

  @Column({ type: 'timestamp', nullable: true })
  deliveryDate: Date; 

  @Column()
  createdAt: Date;

  @Column({ nullable: true })
  updatedAt: Date;
}
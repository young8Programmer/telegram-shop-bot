import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Order } from '../order/order.entity';
import { Cart } from '../cart/cart.entity';
import { Feedback } from '../feedback/feedback.entity';

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  telegramId: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ nullable: true, default: 'uz' })
  language: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => Order, (order) => order.user, { cascade: true })
  orders: Order[];

  @OneToMany(() => Cart, (cart) => cart.user, { cascade: true })
  cartItems: Cart[];

  @OneToMany(() => Feedback, (feedback) => feedback.user, { cascade: true })
  feedbacks: Feedback[];
}
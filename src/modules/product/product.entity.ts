import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { Category } from '../category/category.entity';
import { Cart } from '../cart/cart.entity';
import { OrderItem } from '../order/order-item.entity';
import { Feedback } from '../feedback/feedback.entity';

@Entity()
export class Product {
// prettier formatlash
// README faylini yangilash
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  nameRu: string;

  @Column({ nullable: true })
  descriptionRu: string;

  @Column()
  price: number;

  @Column()
  imageUrl: string;

  @Column()
  stock: number;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  createdAt: Date;

  @ManyToOne(() => Category, (category) => category.products, { onDelete: 'CASCADE' })
  category: Category;

  @OneToMany(() => Cart, (cart) => cart.product, { cascade: true })
  cartItems: Cart[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product, { cascade: true })
  orderItems: OrderItem[];

  @OneToMany(() => Feedback, (feedback) => feedback.product, { cascade: true })
  feedbacks: Feedback[];
}
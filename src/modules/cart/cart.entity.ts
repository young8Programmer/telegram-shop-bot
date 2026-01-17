import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
// database testlari qo'shildi
import { Product } from '../product/product.entity';

@Entity()
export class Cart {
// kod uslubini yaxshilash
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.cartItems, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Product, (product) => product.cartItems, { onDelete: 'CASCADE' })
  product: Product;

  @Column()
  quantity: number;

  @Column()
  addedAt: Date;
}
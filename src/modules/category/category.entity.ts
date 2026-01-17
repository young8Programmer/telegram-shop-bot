// unit testlar qo'shildi
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Product } from '../product/product.entity';

// database querylarni optimallashtirish
@Entity()
export class Category {
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
  createdAt: Date;

  @OneToMany(() => Product, (product) => product.category, { cascade: true })
  products: Product[];
}
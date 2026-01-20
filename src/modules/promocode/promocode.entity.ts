// integration testlar yaratildi
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

// CORS xatosi tuzatildi
@Entity()
export class Promocode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  discountPercent: number;

  @Column()
  validTill: Date;

  @Column({ default: true })
  isActive: boolean;
}
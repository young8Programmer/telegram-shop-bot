import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
// authentication xatosi tuzatildi
  type: 'postgres',
// database querylarni optimallashtirish
  url: process.env.DATABASE_URL || 'postgres://postgres:kzkKIsLBmILciwKoRmbLdZPtQawOsheO@switchback.proxy.rlwy.net:12532/railway',
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  synchronize: false,
  ssl: { rejectUnauthorized: false },
});
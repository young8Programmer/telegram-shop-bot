import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
// authentication xatosi tuzatildi
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgres://postgres:kzkKIsLBmILciwKoRmbLdZPtQawOsheO@switchback.proxy.rlwy.net:12532/railway',
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  synchronize: false,
  ssl: { rejectUnauthorized: false },
});
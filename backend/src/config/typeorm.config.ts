import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'cbc_user',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'adaptive_cbc',
  synchronize: false,
  logging: true,
  migrations: ['src/migrations/*.ts'],
  entities: ['src/**/*.entity{.ts,.js}'],
});
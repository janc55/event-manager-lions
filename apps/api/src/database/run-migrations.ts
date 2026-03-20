import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';

const envPath = path.resolve(process.cwd(), '../../.env');
console.log('Loading env from:', envPath);
dotenv.config({ path: envPath });

console.log('CWD:', process.cwd());
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});

async function runMigrations() {
  await dataSource.initialize();
  console.log('Database connected');
  
  const migrations = await dataSource.runMigrations();
  console.log(`Executed ${migrations.length} migrations`);
  
  await dataSource.destroy();
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error(err);
  process.exit(1);
});

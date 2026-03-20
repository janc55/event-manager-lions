import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../../modules/users/entities/user.entity';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

async function seedAdmin() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [User],
    synchronize: false,
  });

  await dataSource.initialize();

  try {
    const repository = dataSource.getRepository(User);
    const email = process.env.ADMIN_EMAIL?.toLowerCase();
    const fullName = process.env.ADMIN_FULL_NAME ?? 'Administrador General';
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error('ADMIN_EMAIL y ADMIN_PASSWORD son obligatorios para el seed.');
    }

    const existing = await repository.findOne({ where: { email } });

    if (existing) {
      existing.fullName = fullName;
      existing.role = UserRole.ADMIN;
      existing.isActive = true;
      existing.passwordHash = await bcrypt.hash(password, 10);
      await repository.save(existing);
      console.log(`Admin actualizado: ${email}`);
      return;
    }

    const user = repository.create({
      fullName,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: UserRole.ADMIN,
      isActive: true,
    });

    await repository.save(user);
    console.log(`Admin creado: ${email}`);
  } finally {
    await dataSource.destroy();
  }
}

void seedAdmin();

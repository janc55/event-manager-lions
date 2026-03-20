import { Exclude } from 'class-transformer';
import { Column, Entity } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity';
import { UserRole } from '../../../common/enums/user-role.enum';

@Entity('users')
export class User extends AppBaseEntity {
  @Column({ name: 'full_name', length: 150 })
  fullName: string;

  @Column({ unique: true, length: 160 })
  email: string;

  @Exclude()
  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.OPERATOR,
  })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}

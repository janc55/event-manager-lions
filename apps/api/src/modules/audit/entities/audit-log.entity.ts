import { Column, Entity } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity';

@Entity('audit_logs')
export class AuditLogEntity extends AppBaseEntity {
  @Column({ type: 'varchar', name: 'user_id', length: 36, nullable: true })
  userId: string;

  @Column({ length: 120 })
  action: string;

  @Column({ length: 120 })
  entity: string;

  @Column({ name: 'entity_id', length: 120 })
  entityId: string;

  @Column('jsonb', { nullable: true })
  metadata: any;
}

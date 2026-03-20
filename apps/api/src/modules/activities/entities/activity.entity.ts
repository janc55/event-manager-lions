import { Column, Entity } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity';
import { ActivityStatus } from '../../../common/enums/activity-status.enum';

@Entity('activities')
export class Activity extends AppBaseEntity {
  @Column({ length: 160 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime?: string | null;

  @Column({ length: 150 })
  location: string;

  @Column({ type: 'int', nullable: true })
  capacity?: number | null;

  @Column({ name: 'activity_type', length: 60 })
  activityType: string;

  @Column({
    type: 'enum',
    enum: ActivityStatus,
    default: ActivityStatus.DRAFT,
  })
  status: ActivityStatus;
}

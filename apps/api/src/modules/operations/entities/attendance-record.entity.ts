import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity';
import { AttendanceType } from '../../../common/enums/attendance-type.enum';
import { Activity } from '../../activities/entities/activity.entity';
import { Participant } from '../../participants/entities/participant.entity';
import { User } from '../../users/entities/user.entity';

@Entity('attendance_records')
@Index('IDX_attendance_activity', ['activityId', 'participantId'])
export class AttendanceRecord extends AppBaseEntity {
  @ManyToOne(() => Participant, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;

  @Column({ name: 'participant_id' })
  participantId: string;

  @ManyToOne(() => Activity, { nullable: true, eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity?: Activity | null;

  @Column({ name: 'activity_id', type: 'uuid', nullable: true })
  activityId: string;

  @Column({
    name: 'attendance_type',
    type: 'enum',
    enum: AttendanceType,
  })
  attendanceType: AttendanceType;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'scanned_by' })
  scannedBy?: User | null;

  @Column({ name: 'scanned_by', type: 'uuid', nullable: true })
  scannedById: string;

  @Column({ name: 'scanned_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  scannedAt: Date;
}


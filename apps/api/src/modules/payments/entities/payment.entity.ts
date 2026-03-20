import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
import { User } from '../../users/entities/user.entity';
import { Participant } from '../../participants/entities/participant.entity';

@Entity('payments')
export class Payment extends AppBaseEntity {
  @ManyToOne(() => Participant, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;

  @Column({ name: 'participant_id' })
  participantId: string;

  @Column({ length: 120 })
  concept: string;

  @Column({ name: 'expected_amount', type: 'decimal', precision: 10, scale: 2 })
  expectedAmount: number;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ name: 'voucher_file', type: 'varchar', length: 255, nullable: true })
  voucherFile: string | null;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewedBy: User | null;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedById: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}

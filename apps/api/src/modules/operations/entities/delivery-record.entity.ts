import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity';
import { DeliveryType } from '../../../common/enums/delivery-type.enum';
import { Participant } from '../../participants/entities/participant.entity';
import { User } from '../../users/entities/user.entity';

@Entity('delivery_records')
@Unique('UQ_delivery_once', ['participantId', 'deliveryType'])
export class DeliveryRecord extends AppBaseEntity {
  @ManyToOne(() => Participant, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;

  @Column({ name: 'participant_id' })
  participantId: string;

  @Column({
    name: 'delivery_type',
    type: 'enum',
    enum: DeliveryType,
  })
  deliveryType: DeliveryType;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'scanned_by' })
  scannedBy?: User | null;

  @Column({ name: 'scanned_by', type: 'uuid', nullable: true })
  scannedById: string;

  @Column({ name: 'delivered_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  deliveredAt: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;
}

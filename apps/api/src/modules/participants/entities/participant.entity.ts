import { Column, Entity, Index } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity';
import { ParticipantStatus } from '../../../common/enums/participant-status.enum';
import { RegistrationType } from '../../../common/enums/registration-type.enum';

@Entity('participants')
export class Participant extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ name: 'registration_code', length: 50 })
  registrationCode: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ name: 'badge_name', type: 'varchar', length: 120, nullable: true })
  badgeName: string | null;

  @Index()
  @Column({ name: 'document_number', type: 'varchar', length: 50, nullable: true })
  documentNumber: string | null;

  @Column({ type: 'varchar', length: 80 })
  country: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  district: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  club: string | null;

  @Column({ name: 'role_title', type: 'varchar', length: 120, nullable: true })
  roleTitle: string | null;

  @Index()
  @Column({ length: 160 })
  email: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ name: 'participant_type', type: 'varchar', length: 60 })
  participantType: string;

  @Column({ name: 'special_requirements', type: 'text', nullable: true })
  specialRequirements: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Index({ unique: true })
  @Column({ name: 'qr_code', length: 120 })
  qrCode: string;

  @Column({ name: 'lion_number', type: 'varchar', length: 50, nullable: true })
  lionNumber: string | null;

  @Column({ name: 'photo_url', type: 'text', nullable: true })
  photoUrl: string | null;

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.PRE_REGISTERED,
  })
  status: ParticipantStatus;

  @Column({
    name: 'registration_type',
    type: 'enum',
    enum: RegistrationType,
    default: RegistrationType.FULL,
  })
  registrationType: RegistrationType;

  @Column({ name: 'access_rights', type: 'simple-json', nullable: true })
  accessRights: string[] | null;
}

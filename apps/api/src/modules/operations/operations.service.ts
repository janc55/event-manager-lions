import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceType } from '../../common/enums/attendance-type.enum';
import { DeliveryType } from '../../common/enums/delivery-type.enum';
import { ParticipantStatus } from '../../common/enums/participant-status.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ActivitiesService } from '../activities/activities.service';
import { ParticipantsService } from '../participants/participants.service';
import { PaymentsService } from '../payments/payments.service';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { DeliveryRecord } from './entities/delivery-record.entity';

@Injectable()
export class OperationsService {
  constructor(
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRepository: Repository<AttendanceRecord>,
    @InjectRepository(DeliveryRecord)
    private readonly deliveryRepository: Repository<DeliveryRecord>,
    private readonly participantsService: ParticipantsService,
    private readonly activitiesService: ActivitiesService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async scanGeneralAttendance(qrCode: string, user: JwtPayload) {
    const participant = await this.participantsService.findByQrCode(qrCode);

    const existingRecord = await this.attendanceRepository.findOne({
      where: {
        participantId: participant.id,
        attendanceType: AttendanceType.GENERAL,
      },
    });

    if (existingRecord) {
      throw new ConflictException('La asistencia general ya fue registrada.');
    }

    const record = this.attendanceRepository.create({
      participantId: participant.id,
      attendanceType: AttendanceType.GENERAL,
      scannedById: user.sub,
    });

    await this.attendanceRepository.save(record);
    await this.participantsService.update(participant.id, {
      status: ParticipantStatus.CHECKED_IN,
    });

    return this.buildScanResponse(participant.id, 'Asistencia general registrada.');
  }

  async scanActivityAttendance(qrCode: string, activityId: string, user: JwtPayload) {
    const participant = await this.participantsService.findByQrCode(qrCode);
    await this.activitiesService.findOne(activityId);

    // Validate access rights
    if (participant.registrationType === 'PARTIAL') {
      const rights = participant.accessRights || [];
      if (!rights.includes(activityId)) {
        throw new ConflictException('El participante no tiene acceso registrado para esta actividad.');
      }
    }

    const existingRecord = await this.attendanceRepository.findOne({
      where: {
        participantId: participant.id,
        activityId,
        attendanceType: AttendanceType.ACTIVITY,
      },
    });

    if (existingRecord) {
      throw new ConflictException('La asistencia a esta actividad ya fue registrada.');
    }

    const record = this.attendanceRepository.create({
      participantId: participant.id,
      activityId,
      attendanceType: AttendanceType.ACTIVITY,
      scannedById: user.sub,
    });

    await this.attendanceRepository.save(record);

    return this.buildScanResponse(participant.id, 'Asistencia a actividad registrada.');
  }

  async scanMaterialDelivery(qrCode: string, user: JwtPayload, notes?: string) {
    return this.scanDelivery(qrCode, DeliveryType.MATERIALS, user, notes);
  }

  async scanSnackDelivery(qrCode: string, user: JwtPayload, notes?: string) {
    return this.scanDelivery(qrCode, DeliveryType.SNACK, user, notes);
  }

  async attendanceReport() {
    return this.attendanceRepository.find({
      order: { scannedAt: 'DESC' },
    });
  }

  async deliveryReport() {
    return this.deliveryRepository.find({
      order: { deliveredAt: 'DESC' },
    });
  }

  private async scanDelivery(
    qrCode: string,
    deliveryType: DeliveryType,
    user: JwtPayload,
    notes?: string,
  ) {
    const participant = await this.participantsService.findByQrCode(qrCode);

    const existingRecord = await this.deliveryRepository.findOne({
      where: {
        participantId: participant.id,
        deliveryType,
      },
    });

    if (existingRecord) {
      throw new ConflictException('La entrega ya fue registrada.');
    }

    const record = this.deliveryRepository.create({
      participantId: participant.id,
      deliveryType,
      scannedById: user.sub,
      notes,
    });

    await this.deliveryRepository.save(record);

    return this.buildScanResponse(
      participant.id,
      `Entrega de ${deliveryType} registrada correctamente.`,
    );
  }

  private async buildScanResponse(participantId: string, message: string) {
    const participant = await this.participantsService.findOne(participantId);
    const accountStatus = await this.paymentsService.accountStatus(participantId);

    return {
      message,
      participant: {
        id: participant.id,
        fullName: `${participant.firstName} ${participant.lastName}`,
        club: participant.club,
        district: participant.district,
        country: participant.country,
        participantType: participant.participantType,
        status: participant.status,
      },
      accountStatus: {
        status: accountStatus.status,
        balance: accountStatus.balance,
      },
    };
  }
}

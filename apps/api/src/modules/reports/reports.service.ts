import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participant } from '../participants/entities/participant.entity';
import { Payment } from '../payments/entities/payment.entity';
import { AttendanceRecord } from '../operations/entities/attendance-record.entity';
import { DeliveryRecord } from '../operations/entities/delivery-record.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantsRepository: Repository<Participant>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRepository: Repository<AttendanceRecord>,
    @InjectRepository(DeliveryRecord)
    private readonly deliveryRepository: Repository<DeliveryRecord>,
  ) {}

  async participants() {
    const participants = await this.participantsRepository.find();
    return {
      total: participants.length,
      items: participants,
    };
  }

  async payments() {
    const payments = await this.paymentsRepository.find();
    return {
      total: payments.length,
      totalExpected: payments.reduce((sum, item) => sum + Number(item.expectedAmount), 0),
      totalPaid: payments.reduce((sum, item) => sum + Number(item.paidAmount), 0),
      totalBalance: payments.reduce((sum, item) => sum + Number(item.balance), 0),
      items: payments,
    };
  }

  async attendance() {
    const attendance = await this.attendanceRepository.find();
    return {
      total: attendance.length,
      items: attendance,
    };
  }

  async activityAttendance(activityId: string) {
    const attendance = await this.attendanceRepository.find({
      where: { activityId },
    });

    return {
      total: attendance.length,
      items: attendance,
    };
  }

  async deliveries() {
    const deliveries = await this.deliveryRepository.find();
    return {
      total: deliveries.length,
      items: deliveries,
    };
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participant } from '../participants/entities/participant.entity';
import { Payment } from '../payments/entities/payment.entity';
import { AttendanceRecord } from '../operations/entities/attendance-record.entity';
import { DeliveryRecord } from '../operations/entities/delivery-record.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Participant, Payment, AttendanceRecord, DeliveryRecord]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}

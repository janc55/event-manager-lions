import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesModule } from '../activities/activities.module';
import { ParticipantsModule } from '../participants/participants.module';
import { PaymentsModule } from '../payments/payments.module';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { DeliveryRecord } from './entities/delivery-record.entity';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AttendanceRecord, DeliveryRecord]),
    ParticipantsModule,
    ActivitiesModule,
    PaymentsModule,
  ],
  controllers: [OperationsController],
  providers: [OperationsService],
  exports: [OperationsService],
})
export class OperationsModule {}

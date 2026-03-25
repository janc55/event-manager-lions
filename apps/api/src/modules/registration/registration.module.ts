import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participant } from '../participants/entities/participant.entity';
import { Payment } from '../payments/entities/payment.entity';
import { RegistrationController } from './registration.controller';
import { RegistrationService } from './registration.service';

@Module({
    imports: [TypeOrmModule.forFeature([Participant, Payment])],
    controllers: [RegistrationController],
    providers: [RegistrationService],
})
export class RegistrationModule { }

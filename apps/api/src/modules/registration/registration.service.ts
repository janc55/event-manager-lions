import {
    ConflictException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Participant } from '../participants/entities/participant.entity';
import { Payment } from '../payments/entities/payment.entity';
import { RegisterParticipantDto } from './dto/register-participant.dto';
import { ParticipantStatus } from '../../common/enums/participant-status.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

@Injectable()
export class RegistrationService {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(Participant)
        private readonly participantsRepository: Repository<Participant>,
    ) { }

    async register(
        registerDto: RegisterParticipantDto,
        photoFile?: Express.Multer.File,
        voucherFile?: Express.Multer.File,
    ) {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const email = registerDto.email.toLowerCase();

            // Check for duplicates
            const existing = await queryRunner.manager.findOne(Participant, {
                where: [
                    { email },
                    { documentNumber: registerDto.documentNumber || 'not_provided' },
                ],
            });

            if (existing) {
                throw new ConflictException('Participante ya registrado con este email o documento.');
            }

            // 1. Create Participant
            const participant = queryRunner.manager.create(Participant, {
                firstName: registerDto.firstName,
                lastName: registerDto.lastName,
                badgeName: registerDto.badgeName,
                documentNumber: registerDto.documentNumber,
                country: registerDto.country,
                district: registerDto.district,
                club: registerDto.club,
                roleTitle: registerDto.roleTitle,
                email: email,
                phone: registerDto.phone,
                participantType: registerDto.participantType,
                specialRequirements: registerDto.specialRequirements,
                notes: registerDto.notes,
                lionNumber: registerDto.lionNumber,
                registrationCode: this.generateRegistrationCode(),
                qrCode: this.generateQrToken(),
                status: ParticipantStatus.PRE_REGISTERED,
                photoUrl: photoFile ? `/uploads/photos/${photoFile.filename}` : null,
            });

            const savedParticipant = await queryRunner.manager.save(Participant, participant);

            // 2. Create Payment
            const payment = queryRunner.manager.create(Payment, {
                participantId: savedParticipant.id,
                concept: `Registro - ${savedParticipant.participantType}`,
                expectedAmount: registerDto.expectedAmount,
                paidAmount: registerDto.paidAmount,
                balance: registerDto.expectedAmount - registerDto.paidAmount,
                status: this.calculatePaymentStatus(registerDto.paidAmount, registerDto.expectedAmount),
                voucherFile: voucherFile ? `/uploads/vouchers/${voucherFile.filename}` : null,
                notes: registerDto.notes || 'Registro inicial vía formulario web',
            });

            await queryRunner.manager.save(Payment, payment);

            await queryRunner.commitTransaction();

            return savedParticipant;
        } catch (err: any) {
            await queryRunner.rollbackTransaction();
            if (err instanceof ConflictException) throw err;
            throw new InternalServerErrorException('Error en el proceso de registro: ' + (err.message || 'Error desconocido'));
        } finally {
            await queryRunner.release();
        }
    }

    private calculatePaymentStatus(paid: number, expected: number): PaymentStatus {
        if (paid >= expected) return PaymentStatus.PAID;
        if (paid > 0) return PaymentStatus.PARTIAL;
        return PaymentStatus.PENDING;
    }

    private generateRegistrationCode(): string {
        const year = new Date().getFullYear().toString().slice(-2);
        const random = Math.random().toString(36).slice(2, 8).toUpperCase();
        return `LCB-${year}-${random}`;
    }

    private generateQrToken(): string {
        return `qr_${randomUUID()}`;
    }
}
